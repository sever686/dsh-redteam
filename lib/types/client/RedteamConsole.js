import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Red-team console shell: the full-screen surface riding the layout's
 * additive `shell.overlay` seat. Renders nothing while closed (the overlay
 * layer stays click-through for the app underneath); while open it paints
 * header chrome, the projected section nav rail, the active `redteam.section`
 * content, and the telemetry status bar. Close paths: the header button and
 * document-level Escape (the listener's lifetime is the open state's).
 */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import { CONSOLE_STATUS } from "./demo.js";
import { isRedteamSectionId } from "./store.js";
import css from './RedteamConsole.module.css';
/** Status-bar clock: component-private viewing state, one tick per second. */
function StatusClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => { setNow(new Date()); }, 1000);
        return () => { window.clearInterval(timer); };
    }, []);
    return _jsx("span", { className: css.clock, children: now.toLocaleTimeString() });
}
/**
 * Render the console shell.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the console element tree, or null while closed.
 */
export function RedteamConsole(props) {
    const { t, useStore, actions, useSections, renderSlot } = props;
    const open = useStore(s => s.open);
    const active = useStore(s => s.section);
    const rows = useSections(s => s);
    const activeId = rows.some(row => row.id === active) ? active : rows[0]?.id;
    const closeButton = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        closeButton.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                actions.close();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('keydown', onKeyDown); };
    }, [open, actions]);
    if (!open)
        return null;
    return (_jsxs("div", { className: css.console, role: "dialog", "aria-modal": "true", "aria-label": t('console.aria'), children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.titleGroup, children: [_jsx("span", { className: css.brandMark, "aria-hidden": "true" }), _jsx("h1", { className: css.title, children: t('console.title') }), _jsxs("span", { className: css.scopePill, children: [_jsx("span", { className: css.scopeDot, "aria-hidden": "true" }), t('console.scope')] })] }), _jsx("button", { ref: closeButton, type: "button", className: css.close, "aria-label": t('console.close.aria'), onClick: actions.close, children: _jsx(IconCloseOutline16, { size: 14 }) })] }), _jsx("nav", { className: css.nav, "aria-label": t('console.nav'), children: rows.map(row => (_jsx("button", { type: "button", className: clsx(css.navCell, row.id === activeId && css.active), "aria-current": row.id === activeId ? 'true' : undefined, onClick: () => {
                        if (isRedteamSectionId(row.id))
                            actions.selectSection(row.id);
                    }, children: row.label }, row.id))) }), _jsx("main", { className: css.main, children: activeId !== undefined && renderSlot('redteam.section', {}, { only: activeId }) }), _jsxs("footer", { className: css.footer, children: [_jsxs("span", { className: css.footerGroup, children: [_jsx("span", { className: css.engineDot, "aria-hidden": "true" }), t('footer.engine')] }), _jsx("span", { children: t('footer.queue', { count: CONSOLE_STATUS.queue }) }), _jsx("span", { children: t('footer.sessions', { count: CONSOLE_STATUS.sessions }) }), _jsx("span", { className: css.footerSpacer }), _jsx(StatusClock, {})] })] }));
}
//# sourceMappingURL=RedteamConsole.js.map