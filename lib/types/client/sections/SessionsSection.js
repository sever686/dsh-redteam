import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sessions section: the implant/session inventory. Heartbeat rows carry a
 * tone dot (ok/late/lost) plus the localized label — color + text double
 * encoding per the design doc, so the state survives color-blind rendering.
 */
import clsx from 'clsx';
import css from './sections.module.css';
/** Heartbeat tone → dot class (undefined-safe under noUncheckedIndexedAccess). */
const TONE_CLASS = {
    ok: css.dotOk,
    late: css.dotLate,
    lost: css.dotLost,
};
/**
 * Render the sessions section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the session table element tree.
 */
export function SessionsSection({ t, useStore }) {
    const sessions = useStore(s => s.dataset.sessions);
    return (_jsxs("section", { className: css.section, "aria-label": t('sessions.title'), children: [_jsx("div", { className: css.sectionToolbar, children: _jsx("h2", { className: css.sectionTitle, children: t('sessions.title') }) }), sessions.length === 0
                ? _jsx("p", { className: css.empty, children: t('sessions.empty') })
                : (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('sessions.col.implants') }), _jsx("th", { children: t('sessions.col.host') }), _jsx("th", { children: t('sessions.col.user') }), _jsx("th", { children: t('sessions.col.rights') }), _jsx("th", { children: t('sessions.col.os') }), _jsx("th", { children: t('sessions.col.heartbeat') }), _jsx("th", { children: t('sessions.col.uptime') }), _jsx("th", { children: t('sessions.col.type') })] }) }), _jsx("tbody", { children: sessions.map(row => (_jsxs("tr", { children: [_jsx("td", { className: css.mono, children: row.implant }), _jsx("td", { className: css.mono, children: row.host }), _jsx("td", { className: css.mono, children: row.user }), _jsx("td", { children: t(row.rights) }), _jsx("td", { children: row.os }), _jsx("td", { children: _jsxs("span", { className: css.heartbeatCell, children: [_jsx("span", { className: clsx(css.dot, TONE_CLASS[row.heartbeatTone]), "aria-hidden": "true" }), t(row.heartbeat)] }) }), _jsx("td", { className: css.mono, children: row.uptime }), _jsx("td", { children: row.type })] }, row.id))) })] }))] }));
}
//# sourceMappingURL=SessionsSection.js.map