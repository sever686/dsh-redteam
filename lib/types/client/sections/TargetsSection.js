import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Targets section: the scoped asset inventory with a client-side search
 * filter (component-private viewing state). Scope violations render the
 * out-of-scope pill in the danger tone; the production Scope engine blocks
 * them before they could land here.
 */
import { useState } from 'react';
import clsx from 'clsx';
import css from './sections.module.css';
/** Target state → row tone class (clsx drops the undefined fallthrough). */
function targetStateClass(state) {
    switch (state) {
        case 'targets.state.breached': return css.stateBreached;
        case 'targets.state.recon': return css.stateActive;
        case 'targets.state.queued': return css.stateQueued;
        case 'targets.state.dropped': return css.stateDropped;
        default: return undefined;
    }
}
/**
 * Render the targets section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the targets table element tree.
 */
export function TargetsSection({ t, useStore }) {
    const targets = useStore(s => s.dataset.targets);
    const [query, setQuery] = useState('');
    const needle = query.trim().toLowerCase();
    const rows = needle === ''
        ? targets
        : targets.filter(row => row.address.toLowerCase().includes(needle));
    return (_jsxs("section", { className: css.section, "aria-label": t('targets.title'), children: [_jsxs("div", { className: css.sectionToolbar, children: [_jsx("h2", { className: css.sectionTitle, children: t('targets.title') }), _jsx("input", { type: "search", className: css.search, placeholder: t('targets.search'), value: query, onChange: (event) => { setQuery(event.target.value); } })] }), rows.length === 0
                ? _jsx("p", { className: css.empty, children: t('targets.empty') })
                : (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('targets.col.address') }), _jsx("th", { children: t('targets.col.kind') }), _jsx("th", { children: t('targets.col.os') }), _jsx("th", { children: t('targets.col.ports') }), _jsx("th", { children: t('targets.col.rights') }), _jsx("th", { children: t('targets.col.state') }), _jsx("th", { children: t('targets.col.scope') }), _jsx("th", { children: t('targets.col.owner') })] }) }), _jsx("tbody", { children: rows.map(row => (_jsxs("tr", { children: [_jsx("td", { className: css.mono, children: row.address }), _jsx("td", { children: t(row.kind) }), _jsx("td", { children: row.os ?? '—' }), _jsx("td", { className: css.mono, children: row.ports }), _jsx("td", { children: t(row.rights) }), _jsx("td", { children: _jsx("span", { className: clsx(css.badge, targetStateClass(row.state)), children: t(row.state) }) }), _jsx("td", { children: _jsx("span", { className: clsx(css.scopePill, row.inScope ? css.scopeOk : css.scopeBad), children: t(row.inScope ? 'targets.scope.in' : 'targets.scope.out') }) }), _jsx("td", { className: css.mono, children: row.owner })] }, row.id))) })] }))] }));
}
//# sourceMappingURL=TargetsSection.js.map