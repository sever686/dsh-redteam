/**
 * Sessions section: the implant/session inventory. Heartbeat rows carry a
 * tone dot (ok/late/lost) plus the localized label — color + text double
 * encoding per the design doc, so the state survives color-blind rendering.
 */
import clsx from 'clsx'
import type { HeartbeatTone } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** Heartbeat tone → dot class (undefined-safe under noUncheckedIndexedAccess). */
const TONE_CLASS: Record<HeartbeatTone, string | undefined> = {
  ok: css.dotOk,
  late: css.dotLate,
  lost: css.dotLost,
}

/**
 * Render the sessions section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the session table element tree.
 */
export function SessionsSection({ t, useStore }: RedteamSectionProps) {
  const sessions = useStore(s => s.dataset.sessions)
  return (
    <section className={css.section} aria-label={t('sessions.title')}>
      <div className={css.sectionToolbar}>
        <h2 className={css.sectionTitle}>{t('sessions.title')}</h2>
      </div>
      {sessions.length === 0
        ? <p className={css.empty}>{t('sessions.empty')}</p>
        : (
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('sessions.col.implants')}</th>
                <th>{t('sessions.col.host')}</th>
                <th>{t('sessions.col.user')}</th>
                <th>{t('sessions.col.rights')}</th>
                <th>{t('sessions.col.os')}</th>
                <th>{t('sessions.col.heartbeat')}</th>
                <th>{t('sessions.col.uptime')}</th>
                <th>{t('sessions.col.type')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(row => (
                <tr key={row.id}>
                  <td className={css.mono}>{row.implant}</td>
                  <td className={css.mono}>{row.host}</td>
                  <td className={css.mono}>{row.user}</td>
                  <td>{t(row.rights)}</td>
                  <td>{row.os}</td>
                  <td>
                    <span className={css.heartbeatCell}>
                      <span className={clsx(css.dot, TONE_CLASS[row.heartbeatTone])} aria-hidden="true" />
                      {t(row.heartbeat)}
                    </span>
                  </td>
                  <td className={css.mono}>{row.uptime}</td>
                  <td>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  )
}
