import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sidebar-foot trigger for the red-team console. The entry draws its own
 * button chrome (the sidebar supplies only the column state, mirroring the
 * settings trigger seat): a rail icon while collapsed, icon + label while
 * wide. The shared store's open action toggles the console; aria-pressed
 * reflects the console's open state.
 */
import clsx from 'clsx';
import { IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './RedteamTrigger.module.css';
/**
 * Render the sidebar-foot trigger.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the trigger button element tree.
 */
export function RedteamTrigger({ wide, t, useStore, actions }) {
    const open = useStore(s => s.open);
    return (_jsxs("button", { type: "button", className: clsx(css.trigger, wide ? css.wide : css.rail), "aria-pressed": open, "aria-label": t('trigger.aria'), onClick: actions.open, children: [_jsx(IconWarningOutline16, { size: 16, className: css.icon }), wide && _jsx("span", { className: css.label, children: t('trigger.label') })] }));
}
//# sourceMappingURL=RedteamTrigger.js.map