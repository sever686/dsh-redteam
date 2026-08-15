/**
 * Jobs section: the task queue with per-row progress bars. State tones
 * follow the platform tokens; progress width is inline (no color literals).
 */
import clsx from 'clsx'
import type { JobStateKey } from '../demo.ts'
import type { RedteamSectionProps } from '../contract/slots.ts'
import css from './sections.module.css'

/** Job state → badge tone class (clsx drops the undefined fallthrough). */
function jobStateClass(state: JobStateKey): string | undefined {
  switch (state) {
    case 'jobs.state.running': return css.stateActive
    case 'jobs.state.success': return css.stateSuccess
    case 'jobs.state.failed': return css.stateFailed
    case 'jobs.state.queued': return css.stateQueued
    case 'jobs.state.cancelled': return css.stateDropped
    default: return undefined
  }
}

/** Job state → progress-fill tone class. */
function progressClass(state: JobStateKey): string | undefined {
  switch (state) {
    case 'jobs.state.running': return css.progressActive
    case 'jobs.state.success': return css.progressSuccess
    case 'jobs.state.failed': return css.progressFailed
    case 'jobs.state.queued': return css.progressQueued
    case 'jobs.state.cancelled': return css.progressQueued
    default: return undefined
  }
}

/**
 * Render the jobs section.
 * @param props - composed slot props (contract/slots.ts).
 * @returns the job-queue table element tree.
 */
export function JobsSection({ t, useStore }: RedteamSectionProps) {
  const jobs = useStore(s => s.dataset.jobs)
  return (
    <section className={css.section} aria-label={t('jobs.title')}>
      <div className={css.sectionToolbar}>
        <h2 className={css.sectionTitle}>{t('jobs.title')}</h2>
      </div>
      {jobs.length === 0
        ? <p className={css.empty}>{t('jobs.empty')}</p>
        : (
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('jobs.col.task')}</th>
                <th>{t('jobs.col.target')}</th>
                <th>{t('jobs.col.progress')}</th>
                <th>{t('jobs.col.state')}</th>
                <th>{t('jobs.col.elapsed')}</th>
                <th>{t('jobs.col.owner')}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(row => (
                <tr key={row.id}>
                  <td>{t(row.task, { target: row.target })}</td>
                  <td className={css.mono}>{row.target}</td>
                  <td>
                    <div className={css.progress} role="progressbar" aria-valuenow={row.progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className={clsx(css.progressFill, progressClass(row.state))} style={{ width: `${String(row.progress)}%` }} />
                    </div>
                  </td>
                  <td><span className={clsx(css.badge, jobStateClass(row.state))}>{t(row.state)}</span></td>
                  <td className={css.mono}>{row.elapsed}</td>
                  <td className={css.mono}>{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  )
}
