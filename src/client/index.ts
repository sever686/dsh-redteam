/**
 * Red-team operations console, browser half. One shared store handle rides
 * BOTH registrations: the sidebar-foot trigger (`sidebar.footer.action`, an
 * additive list seat owned by ui-sidebar) and the full-screen console
 * (`shell.overlay`, the layout's additive frame-wide seat — click-through
 * while the console renders null). The console entry declares
 * `redteam.section`; the built-in six sections register into it like any
 * third-party section would, and the nav rail projects their entry labels
 * through the locale-following thunk pattern.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls ctx.locale into this program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ctx.slots service merge (the SlotRegistry face).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: the shell.overlay declaration (ui-layout owns the frame layer).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: the sidebar.footer.action declaration (ui-sidebar owns the foot).
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import type { SlotComponent } from '@deepseek-ai/dsh-client-ui-slots'
import type { RedteamConsoleInjected, RedteamSectionProps, RedteamSectionRow } from './contract/slots.ts'
import { createRedteamStore, type RedteamSectionId, type RedteamStoreHandle } from './store.ts'
import { RedteamDataPump, REDTEAM_PUMP_INTERVAL_MS } from './pump.ts'
import { en, zh, type RedteamKey } from './locales.ts'
import { RedteamTrigger } from './RedteamTrigger.tsx'
import { RedteamConsole } from './RedteamConsole.tsx'
import { DashboardSection } from './sections/DashboardSection.tsx'
import { TargetsSection } from './sections/TargetsSection.tsx'
import { JobsSection } from './sections/JobsSection.tsx'
import { SessionsSection } from './sections/SessionsSection.tsx'
import { CredentialsSection } from './sections/CredentialsSection.tsx'
import { ReportsSection } from './sections/ReportsSection.tsx'

export type {
  RedteamConsoleInjected, RedteamConsoleProps, RedteamSectionProps, RedteamSectionRow,
  RedteamTriggerProps,
} from './contract/slots.ts'
export type { RedteamSectionId, RedteamStoreHandle, RedteamStoreState } from './store.ts'
export type { RedteamKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The red-team console's copy. */
    redteam: RedteamKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'redteam'

/** Required services: the slot system and the locale dictionaries. */
export const inject = ['slots', 'locale']

/** The built-in console sections, registered exactly like third-party ones. */
const SECTIONS: readonly {
  id: RedteamSectionId
  order: number
  navKey: RedteamKey
  component: SlotComponent<RedteamSectionProps>
}[] = [
  { id: 'dashboard', order: 0, navKey: 'nav.dashboard', component: DashboardSection },
  { id: 'targets', order: 1, navKey: 'nav.targets', component: TargetsSection },
  { id: 'jobs', order: 2, navKey: 'nav.jobs', component: JobsSection },
  { id: 'sessions', order: 3, navKey: 'nav.sessions', component: SessionsSection },
  { id: 'credentials', order: 4, navKey: 'nav.credentials', component: CredentialsSection },
  { id: 'reports', order: 5, navKey: 'nav.reports', component: ReportsSection },
]

/**
 * Client plugin body: the locale dictionary, the shared store, and the two
 * slot contributions, each installed for the lifetime of its slot's
 * declaration (both seats are declared by shipped entries, so they are live
 * from first boot).
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-redteam: dictionaries')

  // Labels follow the active locale as thunks; the projection cache keys on
  // both the slot ledger version and the locale revision (same pattern as
  // ui-settings-general's settings-section nav).
  const t = ctx.locale.bind(NS)
  const store = createRedteamStore()

  // The console entry's inject factory receives the framework-baked store
  // actions; stashing them here gives the apply-world pump loop its write
  // path (the factory runs at first render, before the first poll tick).
  let bakedActions: ReturnType<RedteamStoreHandle['create']>['actions'] | undefined

  let rowsVersion = -1
  let localeRevision = -1
  let sectionRows: readonly RedteamSectionRow[] = []
  const consoleInjected = (actions: NonNullable<typeof bakedActions>): RedteamConsoleInjected => {
    bakedActions = actions
    return {
      hooks: {
        sections: {
          getSnapshot: () => {
            const version = ctx.slots.getVersion('redteam.section')
            const revision = ctx.locale.getSnapshot().revision
            if (version !== rowsVersion || revision !== localeRevision) {
              rowsVersion = version
              localeRevision = revision
              sectionRows = ctx.slots.entries('redteam.section')
                .map(entry => ({
                  /* v8 ignore next -- list-slot registration requires id (SlotCore rejects an entry without one) */
                  id: entry.options.id ?? '',
                  order: entry.options.order ?? 0,
                  label: resolveSlotLabel(entry.options.label) ?? '',
                }))
                .sort((a, b) => a.order - b.order)
            }
            return sectionRows
          },
          subscribe: (listener) => {
            const offLedger = ctx.slots.subscribe('redteam.section', listener)
            const offLocale = ctx.locale.subscribe(listener)
            return () => {
              offLedger()
              offLocale()
            }
          },
        },
      },
    }
  }

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'redteam',
    order: 20,
    locale: NS,
    store,
  }, RedteamTrigger))

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
  }, RedteamConsole))

  // The data pump: polls the frontend-static-served dataset file and writes
  // validated datasets into the shared store. The interval's lifetime rides
  // this plugin fiber (HMR-unload disposes it).
  ctx.effect(() => {
    const pump = new RedteamDataPump()
    const timer = setInterval(() => {
      void pump.fetchDataset().then((dataset) => {
        if (dataset !== undefined) bakedActions?.setDataset(dataset)
      })
    }, REDTEAM_PUMP_INTERVAL_MS)
    return () => { clearInterval(timer) }
  }, 'ui-redteam: data pump')

  for (const section of SECTIONS) {
    ctx.slots.inject('redteam.section', () => ctx.slots.register({
      name: 'redteam.section',
      id: section.id,
      order: section.order,
      label: () => t(section.navKey),
      locale: NS,
      store,
    }, section.component))
  }
}
