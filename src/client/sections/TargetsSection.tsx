/**
 * Targets section: the scoped asset inventory with a client-side search
 * filter (component-private viewing state). Scope violations render the
 * out-of-scope pill in the danger tone; the production Scope engine blocks
 * them before they could land here.
 */
import { useState } from 'react'
import clsx from 'clsx'
import type { TargetStateKey } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** Target state → row tone class (clsx drops the undefined fallthrough). */
function targetStateClass(state: TargetStateKey): string | undefined {
  switch (state) {
    case 'targets.state.breached': return css.stateBreached
    case 'targets.state.recon': return css.stateActive
    case 'targets.state.queued': return css.stateQueued
    case 'targets.state.dropped': return css.stateDropped
    default: return undefined
  }
}

/**
 * Render the targets section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the targets table element tree.
 */
export function TargetsSection({ t, useStore }: RedteamSectionProps) {
  const targets = useStore(s => s.dataset.targets)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const rows = needle === ''
    ? targets
    : targets.filter(row => row.address.toLowerCase().includes(needle))
  return (
    <section className={css.section} aria-label={t('targets.title')}>
      <div className={css.sectionToolbar}>
        <h2 className={css.sectionTitle}>{t('targets.title')}</h2>
        <input
          type="search"
          className={css.search}
          placeholder={t('targets.search')}
          value={query}
          onChange={(event) => { setQuery(event.target.value) }}
        />
      </div>
      {rows.length === 0
        ? <p className={css.empty}>{t('targets.empty')}</p>
        : (
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('targets.col.address')}</th>
                <th>{t('targets.col.kind')}</th>
                <th>{t('targets.col.os')}</th>
                <th>{t('targets.col.ports')}</th>
                <th>{t('targets.col.rights')}</th>
                <th>{t('targets.col.state')}</th>
                <th>{t('targets.col.scope')}</th>
                <th>{t('targets.col.owner')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className={css.mono}>{row.address}</td>
                  <td>{t(row.kind)}</td>
                  <td>{row.os ?? '—'}</td>
                  <td className={css.mono}>{row.ports}</td>
                  <td>{t(row.rights)}</td>
                  <td><span className={clsx(css.badge, targetStateClass(row.state))}>{t(row.state)}</span></td>
                  <td>
                    <span className={clsx(css.scopePill, row.inScope ? css.scopeOk : css.scopeBad)}>
                      {t(row.inScope ? 'targets.scope.in' : 'targets.scope.out')}
                    </span>
                  </td>
                  <td className={css.mono}>{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  )
}
