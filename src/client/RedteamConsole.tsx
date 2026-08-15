/**
 * Red-team console shell: the full-screen surface riding the layout's
 * additive `shell.overlay` seat. Renders nothing while closed (the overlay
 * layer stays click-through for the app underneath); while open it paints
 * header chrome, the projected section nav rail, the active `redteam.section`
 * content, and the telemetry status bar. Close paths: the header button and
 * document-level Escape (the listener's lifetime is the open state's).
 */
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { CONSOLE_STATUS } from './demo.ts'
import { isRedteamSectionId } from './store.ts'
import type { RedteamConsoleProps } from './contract/slots.ts'
import css from './RedteamConsole.module.css'

/** Status-bar clock: component-private viewing state, one tick per second. */
function StatusClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => { setNow(new Date()) }, 1000)
    return () => { window.clearInterval(timer) }
  }, [])
  return <span className={css.clock}>{now.toLocaleTimeString()}</span>
}

/**
 * Render the console shell.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the console element tree, or null while closed.
 */
export function RedteamConsole(props: RedteamConsoleProps) {
  const { t, useStore, actions, useSections, renderSlot } = props
  const open = useStore(s => s.open)
  const active = useStore(s => s.section)
  const rows = useSections(s => s)
  const activeId = rows.some(row => row.id === active) ? active : rows[0]?.id

  const closeButton = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') actions.close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [open, actions])

  if (!open) return null

  return (
    <div className={css.console} role="dialog" aria-modal="true" aria-label={t('console.aria')}>
      <header className={css.header}>
        <div className={css.titleGroup}>
          <span className={css.brandMark} aria-hidden="true" />
          <h1 className={css.title}>{t('console.title')}</h1>
          <span className={css.scopePill}>
            <span className={css.scopeDot} aria-hidden="true" />
            {t('console.scope')}
          </span>
        </div>
        <button
          ref={closeButton}
          type="button"
          className={css.close}
          aria-label={t('console.close.aria')}
          onClick={actions.close}
        >
          <IconCloseOutline16 size={14} />
        </button>
      </header>
      <nav className={css.nav} aria-label={t('console.nav')}>
        {rows.map(row => (
          <button
            key={row.id}
            type="button"
            className={clsx(css.navCell, row.id === activeId && css.active)}
            aria-current={row.id === activeId ? 'true' : undefined}
            onClick={() => {
              if (isRedteamSectionId(row.id)) actions.selectSection(row.id)
            }}
          >
            {row.label}
          </button>
        ))}
      </nav>
      <main className={css.main}>
        {activeId !== undefined && renderSlot('redteam.section', {}, { only: activeId })}
      </main>
      <footer className={css.footer}>
        <span className={css.footerGroup}>
          <span className={css.engineDot} aria-hidden="true" />
          {t('footer.engine')}
        </span>
        <span>{t('footer.queue', { count: CONSOLE_STATUS.queue })}</span>
        <span>{t('footer.sessions', { count: CONSOLE_STATUS.sessions })}</span>
        <span className={css.footerSpacer} />
        <StatusClock />
      </footer>
    </div>
  )
}
