/**
 * Dashboard section: stat cards derived from the pumped dataset, the
 * high-risk findings panel (focused view of breach/cred events), the
 * live-activity feed, and the scope compliance panel. The cards read the
 * same store every section reads (the data-pump product of redteam-data.json),
 * so the numbers follow the data; only "runtime" stays a placeholder until
 * host telemetry lands.
 */
import { useMemo } from 'react'
import clsx from 'clsx'
import type { StatCard, Severity } from '../demo.ts'
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

/** Sort order: lower rank = more severe. Matches the stat card "待处理发现"口径. */
const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

/** Cap on the findings panel; the rest is summarized as "+N more". */
const FINDINGS_VISIBLE_MAX = 10

/**
 * Render the dashboard section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the dashboard element tree.
 */
export function DashboardSection({ t, useStore }: RedteamSectionProps) {
  const targets = useStore(s => s.dataset.targets)
  const jobs = useStore(s => s.dataset.jobs)
  const sessions = useStore(s => s.dataset.sessions)
  const credentials = useStore(s => s.dataset.credentials)
  const activity = useStore(s => s.dataset.activity)

  // Dataset-backed stat cards: the keys keep the demo structure, the values
  // follow the pumped dataset member-by-member. Only "runtime" remains a
  // placeholder until host telemetry lands.
  const stats: readonly StatCard[] = [
    { key: 'dash.stats.tasks', value: String(jobs.filter(job => job.state === 'jobs.state.queued' || job.state === 'jobs.state.running').length) },
    { key: 'dash.stats.sessions', value: String(sessions.length) },
    { key: 'dash.stats.hosts', value: String(targets.filter(row => row.state === 'targets.state.breached').length) },
    { key: 'dash.stats.findings', value: String(activity.filter(event => event.action === 'activity.action.breach' || event.action === 'activity.action.cred').length) },
    { key: 'dash.stats.credentials', value: String(credentials.length) },
    { key: 'dash.stats.runtime', value: '—' },
  ]
  const inScope = targets.filter(row => row.inScope).length
  const outOfScope = targets.length - inScope

  // High-risk findings: derived view of breach/cred events, sorted by
  // severity tier then by id desc (newest first). Reuses the dataset as the
  // single source — no parallel data structure, no new keys.
  const findings = useMemo(() => {
    const filtered = activity.filter(event =>
      event.action === 'activity.action.breach' || event.action === 'activity.action.cred',
    )
    return [...filtered].sort((left, right) => {
      const rank = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity]
      if (rank !== 0) return rank
      return right.id - left.id
    })
  }, [activity])

  return (
    <div className={css.dashboard}>
      <div className={css.statGrid}>
        {stats.map(stat => (
          <div key={stat.key} className={css.statCard}>
            <div className={css.statValue}>{stat.value}</div>
            <div className={css.statLabel}>{t(stat.key)}</div>
          </div>
        ))}
      </div>
      <section className={css.panel} aria-label={t('dash.findings.title')}>
        <div className={css.findingsHeader}>
          <h2>{t('dash.findings.title')}</h2>
          {findings.length > 0 && (
            <span className={css.findingsHint}>
              {String(findings.length)} · breach / cred
            </span>
          )}
        </div>
        {findings.length === 0
          ? <p className={css.empty}>{t('dash.findings.empty')}</p>
          : (
            <>
              <ul className={css.activity}>
                {findings.slice(0, FINDINGS_VISIBLE_MAX).map(event => (
                  <li key={event.id} className={css.activityRow}>
                    <span className={css.mono}>{event.time}</span>
                    <span className={clsx(css.sevBadge, SEVERITY_CLASS[event.severity])}>
                      {t(SEVERITY_KEY[event.severity])}
                    </span>
                    <span className={css.activityText}>
                      {event.description ?? t(event.action, { target: event.target })}
                    </span>
                    <span className={css.mono}>{event.target}</span>
                  </li>
                ))}
              </ul>
              {findings.length > FINDINGS_VISIBLE_MAX && (
                <p className={css.findingsMore}>
                  {t('dash.findings.more', { count: findings.length - FINDINGS_VISIBLE_MAX })}
                </p>
              )}
            </>
          )}
      </section>
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
                    <span className={css.activityText}>
                      {event.description ?? t(event.action, { target: event.target })}
                    </span>
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
