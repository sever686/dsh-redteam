/**
 * Dashboard section: stat cards, the live-activity feed, and the scope
 * compliance panel. All numbers are static demo fixtures (demo.ts) — the
 * production wiring points (host telemetry, session projection, scope engine)
 * are documented in README.md.
 */
import clsx from 'clsx'
import { STATS, type Severity } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import type { RedteamKey } from '../locales.ts'
import css from './sections.module.css'

/** Severity → dictionary key (template literals would lose the key union). */
const SEVERITY_KEY: Record<Severity, RedteamKey> = {
  critical: 'sev.critical',
  high: 'sev.high',
  medium: 'sev.medium',
  low: 'sev.low',
  info: 'sev.info',
}

/** Severity → badge tone class (undefined-safe under noUncheckedIndexedAccess; clsx drops it). */
const SEVERITY_CLASS: Record<Severity, string | undefined> = {
  critical: css.sevCritical,
  high: css.sevHigh,
  medium: css.sevMedium,
  low: css.sevLow,
  info: css.sevInfo,
}

/**
 * Render the dashboard section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the dashboard element tree.
 */
export function DashboardSection({ t, useStore }: RedteamSectionProps) {
  const targets = useStore(s => s.dataset.targets)
  const activity = useStore(s => s.dataset.activity)
  const inScope = targets.filter(row => row.inScope).length
  const outOfScope = targets.length - inScope
  return (
    <div className={css.dashboard}>
      <div className={css.statGrid}>
        {STATS.map(stat => (
          <div key={stat.key} className={css.statCard}>
            <div className={css.statValue}>{stat.value}</div>
            <div className={css.statLabel}>{t(stat.key)}</div>
          </div>
        ))}
      </div>
      <div className={css.dashColumns}>
        <section className={css.panel} aria-label={t('dash.activity.title')}>
          <h2 className={css.panelTitle}>{t('dash.activity.title')}</h2>
          {activity.length === 0
            ? <p className={css.empty}>{t('dash.activity.empty')}</p>
            : (
              <ul className={css.activity}>
                {activity.map(event => (
                  <li key={event.id} className={css.activityRow}>
                    <span className={css.mono}>{event.time}</span>
                    <span className={clsx(css.sevBadge, SEVERITY_CLASS[event.severity])}>
                      {t(SEVERITY_KEY[event.severity])}
                    </span>
                    <span className={css.activityText}>{t(event.action, { target: event.target })}</span>
                    <span className={css.mono}>{event.target}</span>
                  </li>
                ))}
              </ul>
            )}
        </section>
        <section className={clsx(css.panel, css.scopePanel)} aria-label={t('dash.scope.title')}>
          <h2 className={css.panelTitle}>{t('dash.scope.title')}</h2>
          <div className={css.scopeRow}>
            <span className={clsx(css.scopeDot, css.scopeOk)} aria-hidden="true" />
            <span>{t('dash.scope.in', { count: inScope })}</span>
          </div>
          <div className={css.scopeRow}>
            <span className={clsx(css.scopeDot, css.scopeBlocked)} aria-hidden="true" />
            <span>{t('dash.scope.out', { count: outOfScope })}</span>
          </div>
          <p className={css.scopeHint}>{t('dash.scope.hint')}</p>
        </section>
      </div>
    </div>
  )
}
