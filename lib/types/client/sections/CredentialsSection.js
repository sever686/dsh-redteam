import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Credentials section: the vault rows with masked-by-default secrets. The
 * reveal toggle is component-private viewing state; the production remote
 * would write an audit entry per reveal (the hint says so).
 */
import { useState } from 'react';
import css from './sections.module.css';
/**
 * Render the credentials section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the vault table element tree.
 */
export function CredentialsSection({ t, useStore }) {
    const credentials = useStore(s => s.dataset.credentials);
    const [revealed, setRevealed] = useState(() => new Set());
    const toggle = (id) => {
        setRevealed((current) => {
            const next = new Set(current);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    return (_jsxs("section", { className: css.section, "aria-label": t('creds.title'), children: [_jsx("div", { className: css.sectionToolbar, children: _jsx("h2", { className: css.sectionTitle, children: t('creds.title') }) }), credentials.length === 0
                ? _jsx("p", { className: css.empty, children: t('creds.empty') })
                : (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('creds.col.username') }), _jsx("th", { children: t('creds.col.secret') }), _jsx("th", { children: t('creds.col.type') }), _jsx("th", { children: t('creds.col.source') }), _jsx("th", { children: t('creds.col.hosts') }), _jsx("th", { children: t('creds.col.updated') })] }) }), _jsx("tbody", { children: credentials.map((row) => {
                                const shown = revealed.has(row.id);
                                return (_jsxs("tr", { children: [_jsx("td", { className: css.mono, children: row.username }), _jsx("td", { children: _jsxs("span", { className: css.secretCell, children: [_jsx("span", { className: css.mono, children: shown ? row.secret : t('creds.masked') }), _jsx("button", { type: "button", className: css.reveal, title: shown ? undefined : t('creds.reveal.hint'), "aria-label": shown ? t('creds.hide') : t('creds.reveal'), onClick: () => { toggle(row.id); }, children: shown ? t('creds.hide') : t('creds.reveal') })] }) }), _jsx("td", { children: t(row.type) }), _jsx("td", { children: row.source }), _jsx("td", { className: css.mono, children: row.hosts }), _jsx("td", { className: css.mono, children: row.updated })] }, row.id));
                            }) })] }))] }));
}
//# sourceMappingURL=CredentialsSection.js.map