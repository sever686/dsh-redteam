import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots';
import { createRedteamStore } from "./store.js";
import { RedteamDataPump, REDTEAM_PUMP_INTERVAL_MS } from "./pump.js";
import { en, zh } from "./locales.js";
import { RedteamTrigger } from "./RedteamTrigger.js";
import { RedteamConsole } from "./RedteamConsole.js";
import { DashboardSection } from "./sections/DashboardSection.js";
import { TargetsSection } from "./sections/TargetsSection.js";
import { JobsSection } from "./sections/JobsSection.js";
import { SessionsSection } from "./sections/SessionsSection.js";
import { CredentialsSection } from "./sections/CredentialsSection.js";
import { ReportsSection } from "./sections/ReportsSection.js";
/** Dictionary namespace owned by this plugin. */
const NS = 'redteam';
/** Required services: the slot system and the locale dictionaries. */
export const inject = ['slots', 'locale'];
/** The built-in console sections, registered exactly like third-party ones. */
const SECTIONS = [
    { id: 'dashboard', order: 0, navKey: 'nav.dashboard', component: DashboardSection },
    { id: 'targets', order: 1, navKey: 'nav.targets', component: TargetsSection },
    { id: 'jobs', order: 2, navKey: 'nav.jobs', component: JobsSection },
    { id: 'sessions', order: 3, navKey: 'nav.sessions', component: SessionsSection },
    { id: 'credentials', order: 4, navKey: 'nav.credentials', component: CredentialsSection },
    { id: 'reports', order: 5, navKey: 'nav.reports', component: ReportsSection },
];
/**
 * Client plugin body: the locale dictionary, the shared store, and the two
 * slot contributions, each installed for the lifetime of its slot's
 * declaration (both seats are declared by shipped entries, so they are live
 * from first boot).
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-redteam: dictionaries');
    // Labels follow the active locale as thunks; the projection cache keys on
    // both the slot ledger version and the locale revision (same pattern as
    // ui-settings-general's settings-section nav).
    const t = ctx.locale.bind(NS);
    const store = createRedteamStore();
    // The console entry's inject factory receives the framework-baked store
    // actions; stashing them here gives the apply-world pump loop its write
    // path (the factory runs at first render, before the first poll tick).
    let bakedActions;
    let rowsVersion = -1;
    let localeRevision = -1;
    let sectionRows = [];
    const consoleInjected = (actions) => {
        bakedActions = actions;
        return {
            hooks: {
                sections: {
                    getSnapshot: () => {
                        const version = ctx.slots.getVersion('redteam.section');
                        const revision = ctx.locale.getSnapshot().revision;
                        if (version !== rowsVersion || revision !== localeRevision) {
                            rowsVersion = version;
                            localeRevision = revision;
                            sectionRows = ctx.slots.entries('redteam.section')
                                .map(entry => ({
                                /* v8 ignore next -- list-slot registration requires id (SlotCore rejects an entry without one) */
                                id: entry.options.id ?? '',
                                order: entry.options.order ?? 0,
                                label: resolveSlotLabel(entry.options.label) ?? '',
                            }))
                                .sort((a, b) => a.order - b.order);
                        }
                        return sectionRows;
                    },
                    subscribe: (listener) => {
                        const offLedger = ctx.slots.subscribe('redteam.section', listener);
                        const offLocale = ctx.locale.subscribe(listener);
                        return () => {
                            offLedger();
                            offLocale();
                        };
                    },
                },
            },
        };
    };
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'redteam',
        order: 20,
        locale: NS,
        store,
    }, RedteamTrigger));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'redteam.console',
        order: 20,
        locale: NS,
        store,
        children: {
            'redteam.section': { kind: 'list', scope: 'root' },
        },
        inject: consoleInjected,
    }, RedteamConsole));
    // The data pump: polls the frontend-static-served dataset file and writes
    // validated datasets into the shared store. The interval's lifetime rides
    // this plugin fiber (HMR-unload disposes it).
    ctx.effect(() => {
        const pump = new RedteamDataPump();
        const timer = setInterval(() => {
            void pump.fetchDataset().then((dataset) => {
                if (dataset !== undefined)
                    bakedActions?.setDataset(dataset);
            });
        }, REDTEAM_PUMP_INTERVAL_MS);
        return () => { clearInterval(timer); };
    }, 'ui-redteam: data pump');
    for (const section of SECTIONS) {
        ctx.slots.inject('redteam.section', () => ctx.slots.register({
            name: 'redteam.section',
            id: section.id,
            order: section.order,
            label: () => t(section.navKey),
            locale: NS,
            store,
        }, section.component));
    }
}
//# sourceMappingURL=index.js.map