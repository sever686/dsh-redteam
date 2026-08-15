/**
 * Red-team console store: the shared viewing state between the sidebar-foot
 * trigger, the full-screen console entry, and every section entry. One handle
 * constructed in the apply world is mounted under ALL registrations (all are
 * root scope), so the trigger's `open`, the console's `close`/`selectSection`,
 * and the data pump's `setDataset` write the same instance — the sanctioned
 * cross-entry sharing path.
 *
 * The `dataset` member is the data-pump product (redteam-data.json served by
 * the frontend-static fallback); it lives here until a host Remote domain
 * replaces the file channel — then the pump writes the same action with
 * Remote-fetched rows and nothing downstream changes.
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
import { EMPTY_DATASET } from "./demo.js";
/** The built-in id set, for narrowing projected entry ids at the nav site. */
const REDTEAM_SECTION_IDS = [
    'dashboard', 'targets', 'jobs', 'sessions', 'credentials', 'reports',
];
/** Narrow a projected entry id to a built-in section id. */
export function isRedteamSectionId(id) {
    return REDTEAM_SECTION_IDS.includes(id);
}
/**
 * Declares the console state and its write surface.
 * @returns the store handle (mount it under the trigger, console, and section entries).
 */
export function createRedteamStore() {
    return defineStore({
        init: () => ({ open: false, section: 'dashboard', dataset: EMPTY_DATASET }),
        actions: {
            open: (d) => {
                d.open = true;
            },
            close: (d) => {
                d.open = false;
            },
            selectSection: (d, section) => {
                d.section = section;
            },
            setDataset: (d, dataset) => {
                d.dataset = dataset;
            },
        },
    });
}
//# sourceMappingURL=store.js.map