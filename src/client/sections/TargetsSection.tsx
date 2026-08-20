/**
 * Targets section: the scoped asset inventory with a client-side search
 * filter (component-private viewing state), per-row deletion, and a manual
 * add form. Mutations ask for confirmation first, post to the node half's
 * /redteam-target-delete and /redteam-target-add routes, then apply the store
 * action locally so the table updates immediately (the pump confirms from
 * disk on its cadence).
 */
import { useState } from 'react'
import clsx from 'clsx'
import type { TargetKindKey, TargetRightsKey, TargetRow, TargetStateKey } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** Mutation routes owned by the package's node half. */
const DELETE_URL = '/redteam-target-delete'
const ADD_URL = '/redteam-target-add'

const KIND_OPTIONS: readonly TargetKindKey[] = ['targets.kind.host', 'targets.kind.domain', 'targets.kind.web', 'targets.kind.cloud']
const STATE_OPTIONS: readonly TargetStateKey[] = ['targets.state.queued', 'targets.state.recon', 'targets.state.breached', 'targets.state.dropped']
const RIGHTS_OPTIONS: readonly TargetRightsKey[] = ['targets.rights.none', 'targets.rights.user', 'targets.rights.admin', 'targets.rights.system', 'targets.rights.domain-admin']

/** Add-form draft (component-private viewing state). */
interface AddForm {
  address: string
  kind: TargetKindKey
  os: string
  ports: string
  rights: TargetRightsKey
  state: TargetStateKey
  inScope: boolean
  owner: string
}

const EMPTY_FORM: AddForm = {
  address: '',
  kind: 'targets.kind.host',
  os: '',
  ports: '',
  rights: 'targets.rights.none',
  state: 'targets.state.queued',
  inScope: true,
  owner: 'manual',
}

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
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const needle = query.trim().toLowerCase()
  const rows = needle === ''
    ? targets
    : targets.filter(row => row.address.toLowerCase().includes(needle))

  const patchForm = (part: Partial<AddForm>): void => {
    setForm(current => ({ ...current, ...part }))
  }
  const openAdd = (): void => {
    setForm(EMPTY_FORM)
    setAddError(null)
    setAdding(true)
  }
  const cancelAdd = (): void => {
    if (addBusy) return
    setAdding(false)
    setAddError(null)
  }

  const submitAdd = async (): Promise<void> => {
    if (addBusy) return
    if (form.address.trim() === '') {
      setAddError(t('targets.add.errorAddress'))
      return
    }
    setAddBusy(true)
    setAddError(null)
    try {
      const response = await fetch(ADD_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, address: form.address.trim() }),
      })
      const result = await response.json() as { ok?: boolean; target?: TargetRow; error?: string }
      if (!response.ok || result.ok !== true) {
        setAddError(result.error ?? 'HTTP ' + String(response.status))
        return
      }
      if (result.target !== undefined) actions.addTarget(result.target)
      setAdding(false)
    } catch (cause) {
      setAddError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setAddBusy(false)
    }
  }

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
        <div className={css.toolbarGroup}>
          <input
            type="search"
            className={css.search}
            placeholder={t('targets.search')}
            value={query}
            onChange={(event) => { setQuery(event.target.value) }}
          />
          <button type="button" className={css.addButton} onClick={openAdd}>
            {t('targets.add')}
          </button>
        </div>
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
                <tr key={row.id} className={!row.inScope ? css.outOfScopeRow : undefined} title={!row.inScope ? `${t('targets.scope.out')} · ${row.address}` : undefined}>
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
      {adding && (
        <div className={css.modalBackdrop} role="presentation" onClick={cancelAdd}>
          <div
            className={css.modal}
            role="dialog"
            aria-modal="true"
            aria-label={t('targets.add.title')}
            onClick={(event) => { event.stopPropagation() }}
          >
            <h3 className={css.modalTitle}>{t('targets.add.title')}</h3>
            <div className={css.formGrid}>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.address')} *</span>
                <input
                  className={css.fieldInput}
                  value={form.address}
                  placeholder={t('targets.add.placeholder.address')}
                  autoFocus
                  onChange={(event) => { patchForm({ address: event.target.value }) }}
                />
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.kind')}</span>
                <select
                  className={css.fieldInput}
                  value={form.kind}
                  onChange={(event) => { patchForm({ kind: event.target.value as TargetKindKey }) }}
                >
                  {KIND_OPTIONS.map(kind => <option key={kind} value={kind}>{t(kind)}</option>)}
                </select>
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.os')}</span>
                <input
                  className={css.fieldInput}
                  value={form.os}
                  placeholder={t('targets.add.placeholder.os')}
                  onChange={(event) => { patchForm({ os: event.target.value }) }}
                />
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.ports')}</span>
                <input
                  className={css.fieldInput}
                  value={form.ports}
                  placeholder={t('targets.add.placeholder.ports')}
                  onChange={(event) => { patchForm({ ports: event.target.value }) }}
                />
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.rights')}</span>
                <select
                  className={css.fieldInput}
                  value={form.rights}
                  onChange={(event) => { patchForm({ rights: event.target.value as TargetRightsKey }) }}
                >
                  {RIGHTS_OPTIONS.map(rights => <option key={rights} value={rights}>{t(rights)}</option>)}
                </select>
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.state')}</span>
                <select
                  className={css.fieldInput}
                  value={form.state}
                  onChange={(event) => { patchForm({ state: event.target.value as TargetStateKey }) }}
                >
                  {STATE_OPTIONS.map(state => <option key={state} value={state}>{t(state)}</option>)}
                </select>
              </label>
              <label className={css.field}>
                <span className={css.fieldLabel}>{t('targets.add.field.owner')}</span>
                <input
                  className={css.fieldInput}
                  value={form.owner}
                  placeholder={t('targets.add.placeholder.owner')}
                  onChange={(event) => { patchForm({ owner: event.target.value }) }}
                />
              </label>
              <label className={css.fieldCheck}>
                <input
                  type="checkbox"
                  checked={form.inScope}
                  onChange={(event) => { patchForm({ inScope: event.target.checked }) }}
                />
                <span>{t('targets.add.field.inScope')}</span>
              </label>
            </div>
            {addError !== null && <p className={css.modalError}>{t('targets.add.failed', { error: addError })}</p>}
            <div className={css.modalActions}>
              <button type="button" className={css.modalCancel} disabled={addBusy} onClick={cancelAdd}>
                {t('targets.add.cancel')}
              </button>
              <button type="button" className={css.modalConfirm} disabled={addBusy} onClick={() => { void submitAdd() }}>
                {t('targets.add.submit')}
              </button>
            </div>
          </div>
        </div>
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
