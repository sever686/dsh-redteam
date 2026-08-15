import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Jobs section: the task queue with per-row progress bars. State tones
 * follow the platform tokens; progress width is inline (no color literals).
 */
import clsx from 'clsx';
import css from './sections.module.css';
/** Job state → badge tone class (clsx drops the undefined fallthrough). */
function jobStateClass(state) {
    switch (state) {
        case 'jobs.state.running': return css.stateActive;
        case 'jobs.state.success': return css.stateSuccess;
        case 'jobs.state.failed': return css.stateFailed;
        case 'jobs.state.queued': return css.stateQueued;
        case 'jobs.state.cancelled': return css.stateDropped;
        default: return undefined;
    }
}
/** Job state → progress-fill tone class. */
function progressClass(state) {
    switch (state) {
        case 'jobs.state.running': return css.progressActive;
        case 'jobs.state.success': return css.progressSuccess;
        case 'jobs.state.failed': return css.progressFailed;
        case 'jobs.state.queued': return css.progressQueued;
        case 'jobs.state.cancelled': return css.progressQueued;
        default: return undefined;
    }
}
/**
 * Render the jobs section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the job-queue table element tree.
 */
export function JobsSection({ t, useStore }) {
    const jobs = useStore(s => s.dataset.jobs);
    return (_jsxs("section", { className: css.section, "aria-label": t('jobs.title'), children: [_jsx("div", { className: css.sectionToolbar, children: _jsx("h2", { className: css.sectionTitle, children: t('jobs.title') }) }), jobs.length === 0
                ? _jsx("p", { className: css.empty, children: t('jobs.empty') })
                : (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('jobs.col.task') }), _jsx("th", { children: t('jobs.col.target') }), _jsx("th", { children: t('jobs.col.progress') }), _jsx("th", { children: t('jobs.col.state') }), _jsx("th", { children: t('jobs.col.elapsed') }), _jsx("th", { children: t('jobs.col.owner') })] }) }), _jsx("tbody", { children: jobs.map(row => (_jsxs("tr", { children: [_jsx("td", { children: t(row.task, { target: row.target }) }), _jsx("td", { className: css.mono, children: row.target }), _jsx("td", { children: _jsx("div", { className: css.progress, role: "progressbar", "aria-valuenow": row.progress, "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { className: clsx(css.progressFill, progressClass(row.state)), style: { width: `${String(row.progress)}%` } }) }) }), _jsx("td", { children: _jsx("span", { className: clsx(css.badge, jobStateClass(row.state)), children: t(row.state) }) }), _jsx("td", { className: css.mono, children: row.elapsed }), _jsx("td", { className: css.mono, children: row.owner })] }, row.id))) })] }))] }));
}
//# sourceMappingURL=JobsSection.js.map