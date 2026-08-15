/**
 * Credentials section: the vault rows with masked-by-default secrets. The
 * reveal toggle is component-private viewing state; the production remote
 * would write an audit entry per reveal (the hint says so).
 */
import { useState } from 'react'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/**
 * Render the credentials section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the vault table element tree.
 */
export function CredentialsSection({ t, useStore }: RedteamSectionProps) {
  const credentials = useStore(s => s.dataset.credentials)
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (id: string): void => {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  return (
    <section className={css.section} aria-label={t('creds.title')}>
      <div className={css.sectionToolbar}>
        <h2 className={css.sectionTitle}>{t('creds.title')}</h2>
      </div>
      {credentials.length === 0
        ? <p className={css.empty}>{t('creds.empty')}</p>
        : (
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('creds.col.username')}</th>
                <th>{t('creds.col.secret')}</th>
                <th>{t('creds.col.type')}</th>
                <th>{t('creds.col.source')}</th>
                <th>{t('creds.col.hosts')}</th>
                <th>{t('creds.col.updated')}</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((row) => {
                const shown = revealed.has(row.id)
                return (
                  <tr key={row.id}>
                    <td className={css.mono}>{row.username}</td>
                    <td>
                      <span className={css.secretCell}>
                        <span className={css.mono}>{shown ? row.secret : t('creds.masked')}</span>
                        <button
                          type="button"
                          className={css.reveal}
                          title={shown ? undefined : t('creds.reveal.hint')}
                          aria-label={shown ? t('creds.hide') : t('creds.reveal')}
                          onClick={() => { toggle(row.id) }}
                        >
                          {shown ? t('creds.hide') : t('creds.reveal')}
                        </button>
                      </span>
                    </td>
                    <td>{t(row.type)}</td>
                    <td>{row.source}</td>
                    <td className={css.mono}>{row.hosts}</td>
                    <td className={css.mono}>{row.updated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
    </section>
  )
}
