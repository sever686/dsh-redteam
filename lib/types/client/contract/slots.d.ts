/**
 * Red-team console slot contract: the extension seat this package declares
 * and the composed-props aliases its own components type against. The console
 * shell (RedteamConsole) declares `redteam.section` as its content region;
 * the plugin itself registers the six built-in sections, and any OTHER
 * client plugin may register further sections the same way — the additive
 * extension surface of this console.
 *
 * SlotMap merges for the two seats this plugin registers INTO
 * (`sidebar.footer.action`, owned by ui-sidebar, and `shell.overlay`, owned
 * by ui-layout) are pulled type-only in src/client/index.ts; this package
 * declares nothing it does not own.
 */
import type { ComposedProps, HostObservable, PropsLocale, PropsRuntime, PropsStore, SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { RedteamStoreHandle } from '../store.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /**
         * One content section inside the red-team console. The console shell owns
         * the nav rail (labels projected from entry `label` options) and the
         * open/close state; a section receives only the standard root runtime
         * share plus its own declared locale seat. Registrant options carry
         * `id` (nav key, drives `only` filtering) and `order` (nav position).
         */
        'redteam.section': {
            kind: 'list';
            scope: 'root';
        };
    }
}
/** One projected nav row (id + display order + resolved label). */
export interface RedteamSectionRow {
    /** Entry id, the console's section key. */
    id: string;
    /** Display order declared by the entry. */
    order: number;
    /** Resolved display label (thunks evaluated at read time). */
    label: string;
}
/**
 * The console entry's inject face: a bare observable over the projected
 * section rows. The renderer binds it to the `useSections` selector hook;
 * components never see the source object.
 */
export interface RedteamConsoleInjected {
    hooks: {
        /** Nav-row projection, cached per slots-version x locale-revision. */
        sections: HostObservable<readonly RedteamSectionRow[]>;
    };
}
/**
 * Sidebar-foot trigger props: the sidebar's column state, the shared console
 * store (open state + actions), and the redteam dictionary seat.
 */
export type RedteamTriggerProps = PropsRuntime<'sidebar.footer.action'> & PropsStore<RedteamStoreHandle> & PropsLocale<'redteam'>;
/**
 * Console shell props: root runtime share, the declared `redteam.section`
 * render authority, the shared store, the bound sections hook, and the
 * dictionary seat — the single ComposedProps composition.
 */
export type RedteamConsoleProps = ComposedProps<'shell.overlay', string, 'redteam.section', RedteamStoreHandle, RedteamConsoleInjected, never, 'redteam'>;
/** Section component props: root runtime share, the shared store (dataset + actions), and the dictionary seat. */
export type RedteamSectionProps = PropsRuntime<'redteam.section'> & PropsStore<RedteamStoreHandle> & PropsLocale<'redteam'>;
/** Bound sections selector the console shell consumes. */
export type UseRedteamSections = SnapshotSelectorHook<readonly RedteamSectionRow[]>;
//# sourceMappingURL=slots.d.ts.map