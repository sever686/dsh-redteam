/** Dashboard metric cards: the STRUCTURE is fixed, values are placeholders. */
export const STATS = [
    { key: 'dash.stats.tasks', value: '—' },
    { key: 'dash.stats.sessions', value: '—' },
    { key: 'dash.stats.hosts', value: '—' },
    { key: 'dash.stats.findings', value: '—' },
    { key: 'dash.stats.credentials', value: '—' },
    { key: 'dash.stats.runtime', value: '—' },
];
/** Live activity: empty until the host activity stream is wired. */
export const ACTIVITY = [];
/** Target inventory: empty until the targets Remote / scope engine feeds it. */
export const TARGETS = [];
/** Job queue: empty until the jobs Remote feeds it. */
export const JOBS = [];
/** Implant/session inventory: empty until the sessions projection feeds it. */
export const SESSIONS = [];
/** Credential vault: empty until the credentials Remote feeds it. */
export const CREDENTIALS = [];
/** ATT&CK coverage: the tactic template is structure; technique rows fill from reports. */
export const COVERAGE = [
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
];
/** Console status-bar facts: zero until host telemetry arrives. */
export const CONSOLE_STATUS = {
    queue: 0,
    sessions: 0,
};
/** The shipped empty dataset — the store's initial state until the pump lands. */
export const EMPTY_DATASET = {
    targets: TARGETS,
    jobs: JOBS,
    sessions: SESSIONS,
    credentials: CREDENTIALS,
    activity: ACTIVITY,
    coverage: COVERAGE,
};
//# sourceMappingURL=demo.js.map