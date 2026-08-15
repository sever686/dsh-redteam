// @vitest-environment jsdom
/**
 * Console shell and trigger presentation specs: components are driven with
 * plain stubbed props (the framework shares are stand-ins) and assert
 * user-visible behavior — open/close state, nav rendering, section dispatch,
 * and the Escape close path.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { RedteamTrigger } from '../src/client/RedteamTrigger.tsx'
import { RedteamConsole } from '../src/client/RedteamConsole.tsx'
import type { RedteamConsoleProps, RedteamSectionRow, RedteamTriggerProps } from '../src/client/contract/slots.ts'
import type { RedteamStoreState } from '../src/client/store.ts'
import { EMPTY_DATASET } from '../src/client/demo.ts'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate(zh, commonZh)

const ACTIONS = {
  open: vi.fn(),
  close: vi.fn(),
  selectSection: vi.fn(),
  setDataset: vi.fn(),
}

function triggerProps(overrides: { open?: boolean; wide?: boolean } = {}): RedteamTriggerProps {
  const open = overrides.open ?? false
  return {
    wide: overrides.wide ?? true,
    t,
    useStore: (selector: (state: RedteamStoreState) => unknown) => selector({ open, section: 'dashboard', dataset: EMPTY_DATASET }),
    actions: ACTIONS,
  } as unknown as RedteamTriggerProps
}

const ROWS: readonly RedteamSectionRow[] = [
  { id: 'dashboard', order: 0, label: zh['nav.dashboard'] },
  { id: 'targets', order: 1, label: zh['nav.targets'] },
]

function consoleProps(overrides: { open?: boolean; section?: string } = {}): RedteamConsoleProps {
  const state: RedteamStoreState = {
    open: overrides.open ?? true,
    section: (overrides.section ?? 'dashboard') as RedteamStoreState['section'],
    dataset: EMPTY_DATASET,
  }
  return {
    t,
    useStore: (selector: (s: RedteamStoreState) => unknown) => selector(state),
    actions: ACTIONS,
    useSections: (selector: (s: readonly RedteamSectionRow[]) => unknown) => selector(ROWS),
    renderSlot: vi.fn(() => null),
  } as unknown as RedteamConsoleProps
}

describe('RedteamTrigger', () => {
  it('renders the wide label and forwards the open action', () => {
    const shown = render(<RedteamTrigger {...triggerProps({ wide: true })} />)
    expect(shown.getByText(zh['trigger.label'])).toBeTruthy()
    fireEvent.click(shown.getByRole('button'))
    expect(ACTIONS.open).toHaveBeenCalledTimes(1)
  })

  it('renders icon-only on the rail and reflects the open state', () => {
    ACTIONS.open.mockClear()
    const shown = render(<RedteamTrigger {...triggerProps({ wide: false, open: true })} />)
    expect(shown.queryByText(zh['trigger.label'])).toBeNull()
    expect(shown.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })
})

describe('RedteamConsole', () => {
  it('renders nothing while closed', () => {
    ACTIONS.close.mockClear()
    const closed = render(<RedteamConsole {...consoleProps({ open: false })} />)
    expect(closed.container.firstChild).toBeNull()
  })

  it('renders the nav rail and dispatches the active section', () => {
    ACTIONS.selectSection.mockClear()
    const props = consoleProps({ section: 'targets' })
    const shown = render(<RedteamConsole {...props} />)
    expect(shown.getByText(zh['console.title'])).toBeTruthy()
    expect(shown.getByText(zh['nav.targets']).getAttribute('aria-current')).toBe('true')
    // The render seat received the active section filter.
    expect(props.renderSlot).toHaveBeenCalledWith('redteam.section', {}, { only: 'targets' })
    // Clicking a nav cell selects that section.
    fireEvent.click(shown.getByText(zh['nav.dashboard']))
    expect(ACTIONS.selectSection).toHaveBeenCalledWith('dashboard')
  })

  it('closes on Escape and on the close button', () => {
    ACTIONS.close.mockClear()
    const shown = render(<RedteamConsole {...consoleProps()} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(ACTIONS.close).toHaveBeenCalledTimes(1)
    fireEvent.click(shown.getByRole('button', { name: zh['console.close.aria'] }))
    expect(ACTIONS.close).toHaveBeenCalledTimes(2)
  })

  it('falls back to the first section when the stored id has no entry', () => {
    ACTIONS.selectSection.mockClear()
    const props = consoleProps({ section: 'credentials' })
    render(<RedteamConsole {...props} />)
    expect(props.renderSlot).toHaveBeenCalledWith('redteam.section', {}, { only: 'dashboard' })
  })
})
