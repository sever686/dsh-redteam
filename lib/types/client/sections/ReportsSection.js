import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import css from './sections.module.css';
/** The two shipped report templates (name/desc dictionary keys). */
const TEMPLATES = [
    { name: 'reports.template.standard', desc: 'reports.template.standard.desc' },
    { name: 'reports.template.redteam', desc: 'reports.template.redteam.desc' },
];
/**
 * Render the reports section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the templates + coverage element tree.
 */
export function ReportsSection({ t, useStore }) {
    const coverage = useStore(s => s.dataset.coverage);
    return (_jsxs("section", { className: css.section, "aria-label": t('reports.title'), children: [_jsx("div", { className: css.sectionToolbar, children: _jsx("h2", { className: css.sectionTitle, children: t('reports.title') }) }), _jsx("h3", { className: css.subTitle, children: t('reports.templates') }), _jsx("div", { className: css.cardGrid, children: TEMPLATES.map(template => (_jsxs("div", { className: css.card, children: [_jsx("div", { className: css.cardTitle, children: t(template.name) }), _jsx("p", { className: css.cardDesc, children: t(template.desc) })] }, template.name))) }), _jsx("h3", { className: css.subTitle, children: t('reports.coverage') }), _jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('reports.col.tactic') }), _jsx("th", { children: t('reports.col.techniques') }), _jsx("th", { children: t('reports.col.count') })] }) }), _jsx("tbody", { children: coverage.map(row => (_jsxs("tr", { children: [_jsx("td", { children: t(row.tactic) }), _jsx("td", { className: css.mono, children: row.techniques }), _jsx("td", { className: css.mono, children: String(row.count) })] }, row.tactic))) })] })] }));
}
//# sourceMappingURL=ReportsSection.js.map