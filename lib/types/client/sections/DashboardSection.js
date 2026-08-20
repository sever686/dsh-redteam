import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Dashboard section: stat cards derived from the pumped dataset, the
 * high-risk findings panel (focused view of breach/cred events), the
 * live-activity feed, and the scope compliance panel. The cards read the
 * same store every section reads (the data-pump product of redteam-data.json),
 * so the numbers follow the data; only "runtime" stays a placeholder until
 * host telemetry lands.
 */
import { useMemo } from 'react';
import clsx from 'clsx';
import css from './sections.module.css';
/** Severity → dictionary key (template literals would lose the key union). */
const SEVERITY_KEY = {
    critical: 'sev.critical',
    high: 'sev.high',
    medium: 'sev.medium',
    low: 'sev.low',
    info: 'sev.info',
};
/** Severity → badge tone class (undefined-safe under noUncheckedIndexedAccess; clsx drops it). */
const SEVERITY_CLASS = {
    critical: css.sevCritical,
    high: css.sevHigh,
    medium: css.sevMedium,
    low: css.sevLow,
    info: css.sevInfo,
};
/** Sort order: lower rank = more severe. Matches the stat card "待处理发现"口径. */
const SEVERITY_RANK = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
};
/** Cap on the findings panel; the rest is summarized as "+N more". */
const FINDINGS_VISIBLE_MAX = 10;
/**
 * Render the dashboard section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the dashboard element tree.
 */
export function DashboardSection({ t, useStore }) {
    const targets = useStore(s => s.dataset.targets);
    const jobs = useStore(s => s.dataset.jobs);
    const sessions = useStore(s => s.dataset.sessions);
    const credentials = useStore(s => s.dataset.credentials);
    const activity = useStore(s => s.dataset.activity);
    // Dataset-backed stat cards: the keys keep the demo structure, the values
    // follow the pumped dataset member-by-member. Only "runtime" remains a
    // placeholder until host telemetry lands.
    const stats = [
        { key: 'dash.stats.tasks', value: String(jobs.filter(job => job.state === 'jobs.state.queued' || job.state === 'jobs.state.running').length) },
        { key: 'dash.stats.sessions', value: String(sessions.length) },
        { key: 'dash.stats.hosts', value: String(targets.filter(row => row.state === 'targets.state.breached').length) },
        { key: 'dash.stats.findings', value: String(activity.filter(event => event.action === 'activity.action.breach' || event.action === 'activity.action.cred').length) },
        { key: 'dash.stats.credentials', value: String(credentials.length) },
        { key: 'dash.stats.runtime', value: '—' },
    ];
    const inScope = targets.filter(row => row.inScope).length;
    const outOfScope = targets.length - inScope;
    // High-risk findings: derived view of breach/cred events, sorted by
    // severity tier then by id desc (newest first). Reuses the dataset as the
    // single source — no parallel data structure, no new keys.
    const findings = useMemo(() => {
        const filtered = activity.filter(event => event.action === 'activity.action.breach' || event.action === 'activity.action.cred');
        return [...filtered].sort((left, right) => {
            const rank = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
            if (rank !== 0)
                return rank;
            return right.id - left.id;
        });
    }, [activity]);
    return (_jsxs("div", { className: css.dashboard, children: [_jsx("div", { className: css.statGrid, children: stats.map(stat => (_jsxs("div", { className: css.statCard, children: [_jsx("div", { className: css.statValue, children: stat.value }), _jsx("div", { className: css.statLabel, children: t(stat.key) })] }, stat.key))) }), _jsxs("section", { className: css.panel, "aria-label": t('dash.findings.title'), children: [_jsxs("div", { className: css.findingsHeader, children: [_jsx("h2", { children: t('dash.findings.title') }), findings.length > 0 && (_jsxs("span", { className: css.findingsHint, children: [String(findings.length), " \u00B7 breach / cred"] }))] }), findings.length === 0
                        ? _jsx("p", { className: css.empty, children: t('dash.findings.empty') })
                        : (_jsxs(_Fragment, { children: [_jsx("ul", { className: css.activity, children: findings.slice(0, FINDINGS_VISIBLE_MAX).map(event => (_jsxs("li", { className: css.activityRow, children: [_jsx("span", { className: css.mono, children: event.time }), _jsx("span", { className: clsx(css.sevBadge, SEVERITY_CLASS[event.severity]), children: t(SEVERITY_KEY[event.severity]) }), _jsx("span", { className: css.activityText, children: event.description ?? t(event.action, { target: event.target }) }), _jsx("span", { className: css.mono, children: event.target })] }, event.id))) }), findings.length > FINDINGS_VISIBLE_MAX && (_jsx("p", { className: css.findingsMore, children: t('dash.findings.more', { count: findings.length - FINDINGS_VISIBLE_MAX }) }))] }))] }), _jsxs("div", { className: css.dashColumns, children: [_jsxs("section", { className: css.panel, "aria-label": t('dash.activity.title'), children: [_jsx("h2", { className: css.panelTitle, children: t('dash.activity.title') }), activity.length === 0
                                ? _jsx("p", { className: css.empty, children: t('dash.activity.empty') })
                                : (_jsx("ul", { className: css.activity, children: activity.map(event => (_jsxs("li", { className: css.activityRow, children: [_jsx("span", { className: css.mono, children: event.time }), _jsx("span", { className: clsx(css.sevBadge, SEVERITY_CLASS[event.severity]), children: t(SEVERITY_KEY[event.severity]) }), _jsx("span", { className: css.activityText, children: event.description ?? t(event.action, { target: event.target }) }), _jsx("span", { className: css.mono, children: event.target })] }, event.id))) }))] }), _jsxs("section", { className: clsx(css.panel, css.scopePanel), "aria-label": t('dash.scope.title'), children: [_jsx("h2", { className: css.panelTitle, children: t('dash.scope.title') }), _jsxs("div", { className: css.scopeRow, children: [_jsx("span", { className: clsx(css.scopeDot, css.scopeOk), "aria-hidden": "true" }), _jsx("span", { children: t('dash.scope.in', { count: inScope }) })] }), _jsxs("div", { className: css.scopeRow, children: [_jsx("span", { className: clsx(css.scopeDot, css.scopeBlocked), "aria-hidden": "true" }), _jsx("span", { children: t('dash.scope.out', { count: outOfScope }) })] }), _jsx("p", { className: css.scopeHint, children: t('dash.scope.hint') })] })] })] }));
}
//# sourceMappingURL=DashboardSection.js.map