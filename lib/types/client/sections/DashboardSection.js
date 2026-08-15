import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Dashboard section: stat cards, the live-activity feed, and the scope
 * compliance panel. All numbers are static demo fixtures (demo.ts) — the
 * production wiring points (host telemetry, session projection, scope engine)
 * are documented in README.md.
 */
import clsx from 'clsx';
import { STATS } from "../demo.js";
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
/**
 * Render the dashboard section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the dashboard element tree.
 */
export function DashboardSection({ t, useStore }) {
    const targets = useStore(s => s.dataset.targets);
    const activity = useStore(s => s.dataset.activity);
    const inScope = targets.filter(row => row.inScope).length;
    const outOfScope = targets.length - inScope;
    return (_jsxs("div", { className: css.dashboard, children: [_jsx("div", { className: css.statGrid, children: STATS.map(stat => (_jsxs("div", { className: css.statCard, children: [_jsx("div", { className: css.statValue, children: stat.value }), _jsx("div", { className: css.statLabel, children: t(stat.key) })] }, stat.key))) }), _jsxs("div", { className: css.dashColumns, children: [_jsxs("section", { className: css.panel, "aria-label": t('dash.activity.title'), children: [_jsx("h2", { className: css.panelTitle, children: t('dash.activity.title') }), activity.length === 0
                                ? _jsx("p", { className: css.empty, children: t('dash.activity.empty') })
                                : (_jsx("ul", { className: css.activity, children: activity.map(event => (_jsxs("li", { className: css.activityRow, children: [_jsx("span", { className: css.mono, children: event.time }), _jsx("span", { className: clsx(css.sevBadge, SEVERITY_CLASS[event.severity]), children: t(SEVERITY_KEY[event.severity]) }), _jsx("span", { className: css.activityText, children: t(event.action, { target: event.target }) }), _jsx("span", { className: css.mono, children: event.target })] }, event.id))) }))] }), _jsxs("section", { className: clsx(css.panel, css.scopePanel), "aria-label": t('dash.scope.title'), children: [_jsx("h2", { className: css.panelTitle, children: t('dash.scope.title') }), _jsxs("div", { className: css.scopeRow, children: [_jsx("span", { className: clsx(css.scopeDot, css.scopeOk), "aria-hidden": "true" }), _jsx("span", { children: t('dash.scope.in', { count: inScope }) })] }), _jsxs("div", { className: css.scopeRow, children: [_jsx("span", { className: clsx(css.scopeDot, css.scopeBlocked), "aria-hidden": "true" }), _jsx("span", { children: t('dash.scope.out', { count: outOfScope }) })] }), _jsx("p", { className: css.scopeHint, children: t('dash.scope.hint') })] })] })] }));
}
//# sourceMappingURL=DashboardSection.js.map