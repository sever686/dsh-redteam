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
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { RedteamDataset, TargetRow } from './demo.ts'
import { EMPTY_DATASET } from './demo.ts'

/** Built-in console section ids (nav keys). */
export type RedteamSectionId =
  | 'dashboard'
  | 'targets'
  | 'jobs'
  | 'sessions'
  | 'credentials'
  | 'reports'

/** The built-in id set, for narrowing projected entry ids at the nav site. */
const REDTEAM_SECTION_IDS: readonly string[] = [
  'dashboard', 'targets', 'jobs', 'sessions', 'credentials', 'reports',
]

/** Narrow a projected entry id to a built-in section id. */
export function isRedteamSectionId(id: string): id is RedteamSectionId {
  return REDTEAM_SECTION_IDS.includes(id)
}

/** Console state: interaction facts plus the pump-delivered dataset. */
export interface RedteamStoreState {
  /** Whether the full-screen console is open. */
  open: boolean
  /** The active section id (nav selection). */
  section: RedteamSectionId
  /** The latest pump dataset (empty until the first successful fetch). */
  dataset: RedteamDataset
}

/** Declared action table giving the exported factory a stable return type. */
export type RedteamStoreActions = {
  open: (draft: RedteamStoreState) => void
  close: (draft: RedteamStoreState) => void
  selectSection: (draft: RedteamStoreState, section: RedteamSectionId) => void
  setDataset: (draft: RedteamStoreState, dataset: RedteamDataset) => void
  removeTarget: (draft: RedteamStoreState, id: string) => void
  addTarget: (draft: RedteamStoreState, target: TargetRow) => void
}

/** Handle type consumers (components, props aliases) type against. */
export type RedteamStoreHandle = EngineStoreHandle<RedteamStoreState, RedteamStoreActions>

/**
 * Declares the console state and its write surface.
 * @returns the store handle (mount it under the trigger, console, and section entries).
 */
export function createRedteamStore(): RedteamStoreHandle {
  return defineStore({
    init: (): RedteamStoreState => ({ open: false, section: 'dashboard', dataset: EMPTY_DATASET }),
    actions: {
      open: (d) => {
        d.open = true
      },
      close: (d) => {
        d.open = false
      },
      selectSection: (d, section) => {
        d.section = section
      },
      setDataset: (d, dataset) => {
        d.dataset = dataset
      },
      removeTarget: (d, id) => {
        const target = d.dataset.targets.find(row => row.id === id)
        if (target === undefined) return
        const address = target.address
        d.dataset = {
          ...d.dataset,
          targets: d.dataset.targets.filter(row => row.id !== id),
          jobs: d.dataset.jobs.filter(row => row.target !== address),
          sessions: d.dataset.sessions.filter(row => row.host !== address),
          credentials: d.dataset.credentials.filter(row => row.hosts !== address),
          activity: d.dataset.activity.filter(row => row.target !== address),
        }
      },
      addTarget: (d, target) => {
        d.dataset = { ...d.dataset, targets: [...d.dataset.targets, target] }
      },
    },
  })
}
