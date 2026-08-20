import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Targets section: the scoped asset inventory with a client-side search
 * filter (component-private viewing state), per-row deletion, and a manual
 * add form. Mutations ask for confirmation first, post to the node half's
 * /redteam-target-delete and /redteam-target-add routes, then apply the store
 * action locally so the table updates immediately (the pump confirms from
 * disk on its cadence).
 */
import { useState } from 'react';
import clsx from 'clsx';
import css from './sections.module.css';
/** Mutation routes owned by the package's node half. */
const DELETE_URL = '/redteam-target-delete';
const ADD_URL = '/redteam-target-add';
const KIND_OPTIONS = ['targets.kind.host', 'targets.kind.domain', 'targets.kind.web', 'targets.kind.cloud'];
const STATE_OPTIONS = ['targets.state.queued', 'targets.state.recon', 'targets.state.breached', 'targets.state.dropped'];
const RIGHTS_OPTIONS = ['targets.rights.none', 'targets.rights.user', 'targets.rights.admin', 'targets.rights.system', 'targets.rights.domain-admin'];
const EMPTY_FORM = {
    address: '',
    kind: 'targets.kind.host',
    os: '',
    ports: '',
    rights: 'targets.rights.none',
    state: 'targets.state.queued',
    inScope: true,
    owner: 'manual',
};
/** Target state -> row tone class (clsx drops the undefined fallthrough). */
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
export function TargetsSection({ t, useStore, actions }) {
    const targets = useStore(s => s.dataset.targets);
    const [query, setQuery] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [addBusy, setAddBusy] = useState(false);
    const [addError, setAddError] = useState(null);
    const needle = query.trim().toLowerCase();
    const rows = needle === ''
        ? targets
        : targets.filter(row => row.address.toLowerCase().includes(needle));
    const patchForm = (part) => {
        setForm(current => ({ ...current, ...part }));
    };
    const openAdd = () => {
        setForm(EMPTY_FORM);
        setAddError(null);
        setAdding(true);
    };
    const cancelAdd = () => {
        if (addBusy)
            return;
        setAdding(false);
        setAddError(null);
    };
    const submitAdd = async () => {
        if (addBusy)
            return;
        if (form.address.trim() === '') {
            setAddError(t('targets.add.errorAddress'));
            return;
        }
        setAddBusy(true);
        setAddError(null);
        try {
            const response = await fetch(ADD_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ ...form, address: form.address.trim() }),
            });
            const result = await response.json();
            if (!response.ok || result.ok !== true) {
                setAddError(result.error ?? 'HTTP ' + String(response.status));
                return;
            }
            if (result.target !== undefined)
                actions.addTarget(result.target);
            setAdding(false);
        }
        catch (cause) {
            setAddError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setAddBusy(false);
        }
    };
    const cancelDelete = () => {
        if (busy)
            return;
        setPending(null);
        setError(null);
    };
    const confirmDelete = async () => {
        if (pending === null || busy)
            return;
        setBusy(true);
        setError(null);
        try {
            const response = await fetch(DELETE_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id: pending.id }),
            });
            const result = await response.json();
            if (!response.ok || result.ok !== true) {
                setError(result.error ?? 'HTTP ' + String(response.status));
                return;
            }
            actions.removeTarget(pending.id);
            setPending(null);
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("section", { className: css.section, "aria-label": t('targets.title'), children: [_jsxs("div", { className: css.sectionToolbar, children: [_jsx("h2", { className: css.sectionTitle, children: t('targets.title') }), _jsxs("div", { className: css.toolbarGroup, children: [_jsx("input", { type: "search", className: css.search, placeholder: t('targets.search'), value: query, onChange: (event) => { setQuery(event.target.value); } }), _jsx("button", { type: "button", className: css.addButton, onClick: openAdd, children: t('targets.add') })] })] }), rows.length === 0
                ? _jsx("p", { className: css.empty, children: t('targets.empty') })
                : (_jsxs("table", { className: css.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t('targets.col.address') }), _jsx("th", { children: t('targets.col.kind') }), _jsx("th", { children: t('targets.col.os') }), _jsx("th", { children: t('targets.col.ports') }), _jsx("th", { children: t('targets.col.rights') }), _jsx("th", { children: t('targets.col.state') }), _jsx("th", { children: t('targets.col.scope') }), _jsx("th", { children: t('targets.col.owner') }), _jsx("th", { "aria-hidden": "true" })] }) }), _jsx("tbody", { children: rows.map(row => (_jsxs("tr", { className: !row.inScope ? css.outOfScopeRow : undefined, title: !row.inScope ? `${t('targets.scope.out')} · ${row.address}` : undefined, children: [_jsx("td", { className: css.mono, children: row.address }), _jsx("td", { children: t(row.kind) }), _jsx("td", { children: row.os ?? '—' }), _jsx("td", { className: css.mono, children: row.ports }), _jsx("td", { children: t(row.rights) }), _jsx("td", { children: _jsx("span", { className: clsx(css.badge, targetStateClass(row.state)), children: t(row.state) }) }), _jsx("td", { children: _jsx("span", { className: clsx(css.scopePill, row.inScope ? css.scopeOk : css.scopeBad), children: t(row.inScope ? 'targets.scope.in' : 'targets.scope.out') }) }), _jsx("td", { className: css.mono, children: row.owner }), _jsx("td", { className: css.deleteCell, children: _jsx("button", { type: "button", className: css.deleteButton, "aria-label": t('targets.delete.aria', { address: row.address }), onClick: () => { setError(null); setPending(row); }, children: t('targets.delete') }) })] }, row.id))) })] })), adding && (_jsx("div", { className: css.modalBackdrop, role: "presentation", onClick: cancelAdd, children: _jsxs("div", { className: css.modal, role: "dialog", "aria-modal": "true", "aria-label": t('targets.add.title'), onClick: (event) => { event.stopPropagation(); }, children: [_jsx("h3", { className: css.modalTitle, children: t('targets.add.title') }), _jsxs("div", { className: css.formGrid, children: [_jsxs("label", { className: css.field, children: [_jsxs("span", { className: css.fieldLabel, children: [t('targets.add.field.address'), " *"] }), _jsx("input", { className: css.fieldInput, value: form.address, placeholder: t('targets.add.placeholder.address'), autoFocus: true, onChange: (event) => { patchForm({ address: event.target.value }); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.kind') }), _jsx("select", { className: css.fieldInput, value: form.kind, onChange: (event) => { patchForm({ kind: event.target.value }); }, children: KIND_OPTIONS.map(kind => _jsx("option", { value: kind, children: t(kind) }, kind)) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.os') }), _jsx("input", { className: css.fieldInput, value: form.os, placeholder: t('targets.add.placeholder.os'), onChange: (event) => { patchForm({ os: event.target.value }); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.ports') }), _jsx("input", { className: css.fieldInput, value: form.ports, placeholder: t('targets.add.placeholder.ports'), onChange: (event) => { patchForm({ ports: event.target.value }); } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.rights') }), _jsx("select", { className: css.fieldInput, value: form.rights, onChange: (event) => { patchForm({ rights: event.target.value }); }, children: RIGHTS_OPTIONS.map(rights => _jsx("option", { value: rights, children: t(rights) }, rights)) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.state') }), _jsx("select", { className: css.fieldInput, value: form.state, onChange: (event) => { patchForm({ state: event.target.value }); }, children: STATE_OPTIONS.map(state => _jsx("option", { value: state, children: t(state) }, state)) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('targets.add.field.owner') }), _jsx("input", { className: css.fieldInput, value: form.owner, placeholder: t('targets.add.placeholder.owner'), onChange: (event) => { patchForm({ owner: event.target.value }); } })] }), _jsxs("label", { className: css.fieldCheck, children: [_jsx("input", { type: "checkbox", checked: form.inScope, onChange: (event) => { patchForm({ inScope: event.target.checked }); } }), _jsx("span", { children: t('targets.add.field.inScope') })] })] }), addError !== null && _jsx("p", { className: css.modalError, children: t('targets.add.failed', { error: addError }) }), _jsxs("div", { className: css.modalActions, children: [_jsx("button", { type: "button", className: css.modalCancel, disabled: addBusy, onClick: cancelAdd, children: t('targets.add.cancel') }), _jsx("button", { type: "button", className: css.modalConfirm, disabled: addBusy, onClick: () => { void submitAdd(); }, children: t('targets.add.submit') })] })] }) })), pending !== null && (_jsx("div", { className: css.modalBackdrop, role: "presentation", onClick: cancelDelete, children: _jsxs("div", { className: css.modal, role: "alertdialog", "aria-modal": "true", "aria-label": t('targets.delete.confirmTitle'), onClick: (event) => { event.stopPropagation(); }, children: [_jsx("h3", { className: css.modalTitle, children: t('targets.delete.confirmTitle') }), _jsx("p", { className: css.modalBody, children: t('targets.delete.confirmBody') }), _jsx("p", { className: css.modalAddress, children: _jsx("span", { className: css.mono, children: t('targets.delete.address', { address: pending.address }) }) }), error !== null && _jsx("p", { className: css.modalError, children: t('targets.delete.failed', { error }) }), _jsxs("div", { className: css.modalActions, children: [_jsx("button", { type: "button", className: css.modalCancel, disabled: busy, onClick: cancelDelete, children: t('targets.delete.cancel') }), _jsx("button", { type: "button", className: css.modalConfirm, disabled: busy, onClick: () => { void confirmDelete(); }, children: t('targets.delete.confirm') })] })] }) }))] }));
}
//# sourceMappingURL=TargetsSection.js.map