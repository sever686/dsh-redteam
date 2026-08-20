/**
 * Targets section: the scoped asset inventory with a client-side search
 * filter (component-private viewing state) and per-row deletion. Deletion
 * asks for confirmation first, posts to the node half's
 * /redteam-target-delete route, then applies the store action locally so the
 * table updates immediately (the pump confirms from disk on its cadence).
 */
import { useState } from 'react'
import clsx from 'clsx'
import type { TargetRow, TargetStateKey } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** Deletion route owned by the package's node half. */
const DELETE_URL = '/redteam-target-delete'

/** Target state -> row tone class (clsx drops the undefined fallthrough). */
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
export function TargetsSection({ t, useStore, actions }: RedteamSectionProps) {
  const targets = useStore(s => s.dataset.targets)
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<TargetRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const rows = needle === ''
    ? targets
    : targets.filter(row => row.address.toLowerCase().includes(needle))

  const cancelDelete = (): void => {
    if (busy) return
    setPending(null)
    setError(null)
  }

  const confirmDelete = async (): Promise<void> => {
    if (pending === null || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(DELETE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: pending.id }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || result.ok !== true) {
        setError(result.error ?? 'HTTP ' + String(response.status))
        return
      }
      actions.removeTarget(pending.id)
      setPending(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

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
                <th aria-hidden="true" />
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
                  <td className={css.deleteCell}>
                    <button
                      type="button"
                      className={css.deleteButton}
                      aria-label={t('targets.delete.aria', { address: row.address })}
                      onClick={() => { setError(null); setPending(row) }}
                    >
                      {t('targets.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      {pending !== null && (
        <div className={css.modalBackdrop} role="presentation" onClick={cancelDelete}>
          <div
            className={css.modal}
            role="alertdialog"
            aria-modal="true"
            aria-label={t('targets.delete.confirmTitle')}
            onClick={(event) => { event.stopPropagation() }}
          >
            <h3 className={css.modalTitle}>{t('targets.delete.confirmTitle')}</h3>
            <p className={css.modalBody}>{t('targets.delete.confirmBody')}</p>
            <p className={css.modalAddress}>
              <span className={css.mono}>{t('targets.delete.address', { address: pending.address })}</span>
            </p>
            {error !== null && <p className={css.modalError}>{t('targets.delete.failed', { error })}</p>}
            <div className={css.modalActions}>
              <button type="button" className={css.modalCancel} disabled={busy} onClick={cancelDelete}>
                {t('targets.delete.cancel')}
              </button>
              <button type="button" className={css.modalConfirm} disabled={busy} onClick={() => { void confirmDelete() }}>
                {t('targets.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}