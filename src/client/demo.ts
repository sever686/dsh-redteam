/**
 * Data-layer placeholder for the red-team console. Every fixture ships EMPTY
 * by design: the console renders its empty states until the production
 * wiring arrives. The row TYPES below are the production contracts — the
 * Host Remote API / projection integration (documented in README.md) fills
 * these same shapes, so sections keep compiling against the data layer
 * while the demo content stays out of the product. Status-ish fields carry
 * typed dictionary keys so the sections render them through `t` and the
 * whole dataset localizes for free.
 */
import type { RedteamKey } from './locales.ts'

/** Severity axis shared by activity rows. */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/** Target kind / state / rights dictionary-key unions. */
export type TargetKindKey = 'targets.kind.host' | 'targets.kind.domain' | 'targets.kind.web' | 'targets.kind.cloud'
export type TargetStateKey = 'targets.state.queued' | 'targets.state.recon' | 'targets.state.breached' | 'targets.state.dropped'
export type TargetRightsKey = 'targets.rights.none' | 'targets.rights.user' | 'targets.rights.admin' | 'targets.rights.system' | 'targets.rights.domain-admin'

/** Job state dictionary-key union. */
export type JobStateKey = 'jobs.state.queued' | 'jobs.state.running' | 'jobs.state.success' | 'jobs.state.failed' | 'jobs.state.cancelled'

/** Session heartbeat dictionary-key union plus its display tone. */
export type HeartbeatKey = 'sessions.heartbeat.ok' | 'sessions.heartbeat.late' | 'sessions.heartbeat.lost'
export type HeartbeatTone = 'ok' | 'late' | 'lost'

/** Credential type dictionary-key union. */
export type CredTypeKey = 'creds.type.ntlm' | 'creds.type.kerberoast' | 'creds.type.plain' | 'creds.type.ticket'

/** Activity action dictionary-key union. */
export type ActionKey =
  | 'activity.action.scan'
  | 'activity.action.breach'
  | 'activity.action.cred'
  | 'activity.action.recon'
  | 'activity.action.report'

/** One target inventory row (the state/kind/rights fields are dictionary keys). */
export interface TargetRow {
  id: string
  address: string
  kind: TargetKindKey
  os: string | null
  ports: string
  rights: TargetRightsKey
  state: TargetStateKey
  inScope: boolean
  owner: string
}

/** One job-queue row. */
export interface JobRow {
  id: string
  task: ActionKey
  target: string
  progress: number
  state: JobStateKey
  elapsed: string
  owner: string
}

/** One implant/session row. */
export interface SessionRow {
  id: string
  implant: string
  host: string
  user: string
  rights: TargetRightsKey
  os: string
  heartbeat: HeartbeatKey
  heartbeatTone: HeartbeatTone
  uptime: string
  type: string
}

/** One credential-vault row (the secret is demo material, revealed on demand). */
export interface CredentialRow {
  id: string
  username: string
  secret: string
  type: CredTypeKey
  source: string
  hosts: string
  updated: string
}

/** One live-activity event (description = key + interpolation params). */
export interface ActivityEvent {
  id: number
  time: string
  severity: Severity
  action: ActionKey
  target: string
}

/** One dashboard stat card. */
export interface StatCard {
  key: RedteamKey
  value: string
}

/** One ATT&CK coverage row. */
export interface CoverageRow {
  tactic: RedteamKey
  techniques: string
  count: number
}

/** Dashboard metric cards: the STRUCTURE is fixed, values are placeholders. */
export const STATS: readonly StatCard[] = [
  { key: 'dash.stats.tasks', value: '—' },
  { key: 'dash.stats.sessions', value: '—' },
  { key: 'dash.stats.hosts', value: '—' },
  { key: 'dash.stats.findings', value: '—' },
  { key: 'dash.stats.credentials', value: '—' },
  { key: 'dash.stats.runtime', value: '—' },
]

/** Live activity: empty until the host activity stream is wired. */
export const ACTIVITY: readonly ActivityEvent[] = []

/** Target inventory: empty until the targets Remote / scope engine feeds it. */
export const TARGETS: readonly TargetRow[] = []

/** Job queue: empty until the jobs Remote feeds it. */
export const JOBS: readonly JobRow[] = []

/** Implant/session inventory: empty until the sessions projection feeds it. */
export const SESSIONS: readonly SessionRow[] = []

/** Credential vault: empty until the credentials Remote feeds it. */
export const CREDENTIALS: readonly CredentialRow[] = []

/** ATT&CK coverage: the tactic template is structure; technique rows fill from reports. */
export const COVERAGE: readonly CoverageRow[] = [
  { tactic: 'reports.tactic.recon', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.resource', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.initial', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.execution', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.persistence', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.privilege', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.defense', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.credential', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.discovery', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.lateral', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.collection', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.c2', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.exfil', techniques: '—', count: 0 },
  { tactic: 'reports.tactic.impact', techniques: '—', count: 0 },
]

/** Console status-bar facts: zero until host telemetry arrives. */
export const CONSOLE_STATUS = {
  queue: 0,
  sessions: 0,
}

/**
 * The console dataset: the one shape the data pump delivers and the store
 * holds. Row arrays below this point are the per-domain contracts; the pump
 * file (`redteam-data.json` under the frontend dist) carries the same shape
 * and is validated member-by-member on arrival.
 */
export interface RedteamDataset {
  targets: readonly TargetRow[]
  jobs: readonly JobRow[]
  sessions: readonly SessionRow[]
  credentials: readonly CredentialRow[]
  activity: readonly ActivityEvent[]
  coverage: readonly CoverageRow[]
}

/** The shipped empty dataset — the store's initial state until the pump lands. */
export const EMPTY_DATASET: RedteamDataset = {
  targets: TARGETS,
  jobs: JOBS,
  sessions: SESSIONS,
  credentials: CREDENTIALS,
  activity: ACTIVITY,
  coverage: COVERAGE,
}
