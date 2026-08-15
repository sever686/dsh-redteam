/**
 * Reports section: report templates plus the ATT&CK coverage matrix. The
 * templates render as descriptive cards; the generate buttons are the
 * production integration point (report-generation Remote) and stay out of
 * the demo surface.
 */
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** The two shipped report templates (name/desc dictionary keys). */
const TEMPLATES = [
  { name: 'reports.template.standard', desc: 'reports.template.standard.desc' },
  { name: 'reports.template.redteam', desc: 'reports.template.redteam.desc' },
] as const

/**
 * Render the reports section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the templates + coverage element tree.
 */
export function ReportsSection({ t, useStore }: RedteamSectionProps) {
  const coverage = useStore(s => s.dataset.coverage)
  return (
    <section className={css.section} aria-label={t('reports.title')}>
      <div className={css.sectionToolbar}>
        <h2 className={css.sectionTitle}>{t('reports.title')}</h2>
      </div>
      <h3 className={css.subTitle}>{t('reports.templates')}</h3>
      <div className={css.cardGrid}>
        {TEMPLATES.map(template => (
          <div key={template.name} className={css.card}>
            <div className={css.cardTitle}>{t(template.name)}</div>
            <p className={css.cardDesc}>{t(template.desc)}</p>
          </div>
        ))}
      </div>
      <h3 className={css.subTitle}>{t('reports.coverage')}</h3>
      <table className={css.table}>
        <thead>
          <tr>
            <th>{t('reports.col.tactic')}</th>
            <th>{t('reports.col.techniques')}</th>
            <th>{t('reports.col.count')}</th>
          </tr>
        </thead>
        <tbody>
          {coverage.map(row => (
            <tr key={row.tactic}>
              <td>{t(row.tactic)}</td>
              <td className={css.mono}>{row.techniques}</td>
              <td className={css.mono}>{String(row.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
