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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type RedteamKey } from './locales.ts';
export type { RedteamConsoleInjected, RedteamConsoleProps, RedteamSectionProps, RedteamSectionRow, RedteamTriggerProps, } from './contract/slots.ts';
export type { RedteamSectionId, RedteamStoreHandle, RedteamStoreState } from './store.ts';
export type { RedteamKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The red-team console's copy. */
        redteam: RedteamKey;
    }
}
/** Required services: the slot system and the locale dictionaries. */
export declare const inject: string[];
/**
 * Client plugin body: the locale dictionary, the shared store, and the two
 * slot contributions, each installed for the lifetime of its slot's
 * declaration (both seats are declared by shipped entries, so they are live
 * from first boot).
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map