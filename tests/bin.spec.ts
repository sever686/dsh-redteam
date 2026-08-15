/**
 * `redteam` CLI specs: init writes the six-array template and refuses
 * overwrites; publish validates JSON and copies into the dist root; unknown
 * commands and missing arguments fail loudly. Temp dirs per spec.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initDataset, mergeDatasets, mergeIntoDataset, publishDataset, PUMP_FILENAME, runRedteam } from '../src/bin/redteam.ts'
import type { RedteamDataset } from '../src/client/demo.ts'

const TEMP_DIRS: string[] = []
afterEach(() => {
  for (const dir of TEMP_DIRS) {
    try { writeFileSync(join(dir, 'x'), '') } catch { /* already gone */ }
  }
})

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'redteam-cli-'))
  TEMP_DIRS.push(dir)
  return dir
}

function silenceConsole<T>(run: () => T): T {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    return run()
  } finally {
    spy.mockRestore()
  }
}

describe('redteam init', () => {
  it('writes the empty dataset template with all six arrays', () => {
    const dir = tempDir()
    const target = join(dir, 'data.json')
    const code = initDataset(target)
    expect(code).toBe(0)
    const parsed = JSON.parse(readFileSync(target, 'utf8')) as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(['activity', 'coverage', 'credentials', 'jobs', 'sessions', 'targets'])
    for (const key of Object.keys(parsed)) {
      expect(Array.isArray(parsed[key])).toBe(true)
    }
  })

  it('refuses to overwrite an existing file', () => {
    const dir = tempDir()
    const target = join(dir, 'data.json')
    writeFileSync(target, '{}')
    expect(silenceConsole(() => initDataset(target))).toBe(1)
    expect(readFileSync(target, 'utf8')).toBe('{}')
  })
})

describe('redteam publish', () => {
  it('validates and copies the dataset into the dist root', () => {
    const dir = tempDir()
    const source = join(dir, 'data.json')
    writeFileSync(source, JSON.stringify({ targets: [], jobs: [], sessions: [], credentials: [], activity: [], coverage: [] }))
    const dist = join(dir, 'dist')
    const code = publishDataset(source, dist)
    expect(code).toBe(0)
    expect(existsSync(join(dist, PUMP_FILENAME))).toBe(true)
    // publish re-serializes pretty-printed; the parsed payload is what must match.
    expect(JSON.parse(readFileSync(join(dist, PUMP_FILENAME), 'utf8')) as unknown)
      .toStrictEqual(JSON.parse(readFileSync(source, 'utf8')) as unknown)
  })

  it('rejects invalid JSON without touching the dist', () => {
    const dir = tempDir()
    const source = join(dir, 'data.json')
    writeFileSync(source, '{not json')
    const dist = join(dir, 'dist')
    expect(silenceConsole(() => publishDataset(source, dist))).toBe(1)
    expect(existsSync(join(dist, PUMP_FILENAME))).toBe(false)
  })

  it('creates the dist directory when absent', () => {
    const dir = tempDir()
    const source = join(dir, 'data.json')
    writeFileSync(source, JSON.stringify({ targets: [], jobs: [], sessions: [], credentials: [], activity: [], coverage: [] }))
    const dist = join(dir, 'nested', 'dist')
    expect(publishDataset(source, dist)).toBe(0)
    expect(existsSync(join(dist, PUMP_FILENAME))).toBe(true)
  })

  it('rejects a file that is not a six-array dataset', () => {
    const dir = tempDir()
    const source = join(dir, 'data.json')
    writeFileSync(source, '{"targets": []}')
    const dist = join(dir, 'dist')
    expect(silenceConsole(() => publishDataset(source, dist))).toBe(1)
  })
})

describe('redteam merge', () => {
  const baseDataset = (): RedteamDataset => ({
    targets: [
      { id: 't-1', address: '10.0.0.1', kind: 'targets.kind.host', os: 'Linux', ports: '22/tcp', rights: 'targets.rights.none', state: 'targets.state.recon', inScope: true, owner: 'pump' },
    ],
    jobs: [
      { id: 'j-1', task: 'activity.action.scan', target: '10.0.0.1', progress: 100, state: 'jobs.state.success', elapsed: '1s', owner: 'pump' },
    ],
    sessions: [],
    credentials: [],
    activity: [
      { id: 1, time: '10:00', severity: 'info', action: 'activity.action.scan', target: '10.0.0.1' },
    ],
    coverage: [
      { tactic: 'reports.tactic.recon', techniques: 'T1046', count: 1 },
    ],
  })

  it('upserts rows by id and re-orders activity newest-first', () => {
    const merged = mergeDatasets(baseDataset(), {
      targets: [
        { id: 't-1', address: '10.0.0.1', kind: 'targets.kind.host', os: 'Linux (updated)', ports: '22/tcp', rights: 'targets.rights.user', state: 'targets.state.breached', inScope: true, owner: 'pump' },
        { id: 't-2', address: '10.0.0.2', kind: 'targets.kind.host', os: null, ports: '—', rights: 'targets.rights.none', state: 'targets.state.queued', inScope: true, owner: 'pump' },
      ],
      activity: [
        { id: 2, time: '10:05', severity: 'low', action: 'activity.action.recon', target: '10.0.0.2' },
      ],
      coverage: [
        { tactic: 'reports.tactic.recon', techniques: 'T1018, T1046', count: 2 },
      ],
    })
    expect(merged.targets.map(t => t.id)).toEqual(['t-1', 't-2'])
    expect(merged.targets[0]?.os).toBe('Linux (updated)')
    expect(merged.targets[0]?.state).toBe('targets.state.breached')
    expect(merged.activity.map(a => a.id)).toEqual([2, 1])
    expect(merged.coverage[0]).toEqual({ tactic: 'reports.tactic.recon', techniques: 'T1018, T1046', count: 2 })
    expect(merged.jobs).toEqual(baseDataset().jobs)
  })

  it('keeps base arrays for absent keys, and empty fragments wipe nothing', () => {
    const merged = mergeDatasets(baseDataset(), { credentials: [] })
    expect(merged.targets).toHaveLength(1)
    expect(merged.jobs).toHaveLength(1)
    expect(merged.coverage).toHaveLength(1)
    expect(merged.credentials).toHaveLength(0)
    // An empty present array is "no new rows", not "wipe".
    const withEmptyTargets = mergeDatasets(baseDataset(), { targets: [] })
    expect(withEmptyTargets.targets).toHaveLength(1)
  })

  it('merges a fragment file into a dataset file in place', () => {
    const dir = tempDir()
    const target = join(dir, 'data.json')
    const fragment = join(dir, 'fragment.json')
    writeFileSync(target, JSON.stringify(baseDataset()))
    writeFileSync(fragment, JSON.stringify({
      jobs: [{ id: 'j-2', task: 'activity.action.breach', target: '10.0.0.1', progress: 100, state: 'jobs.state.success', elapsed: '2s', owner: 'pump' }],
    }))
    expect(mergeIntoDataset(fragment, target)).toBe(0)
    const parsed = JSON.parse(readFileSync(target, 'utf8')) as RedteamDataset
    expect(parsed.jobs.map(j => j.id)).toEqual(['j-1', 'j-2'])
    expect(parsed.targets).toHaveLength(1)
  })

  it('rejects a fragment whose members are not dataset arrays', () => {
    const dir = tempDir()
    const target = join(dir, 'data.json')
    const fragment = join(dir, 'fragment.json')
    writeFileSync(target, JSON.stringify(baseDataset()))
    writeFileSync(fragment, '{"targets": "not-an-array"}')
    expect(silenceConsole(() => mergeIntoDataset(fragment, target))).toBe(1)
    expect(JSON.parse(readFileSync(target, 'utf8')) as RedteamDataset).toEqual(baseDataset())
  })

  it('tolerates a UTF-8 BOM on fragment and dataset files', () => {
    const dir = tempDir()
    const target = join(dir, 'data.json')
    const fragment = join(dir, 'fragment.json')
    writeFileSync(target, `\uFEFF${JSON.stringify(baseDataset())}`)
    writeFileSync(fragment, `\uFEFF${JSON.stringify({ targets: [] })}`)
    expect(mergeIntoDataset(fragment, target)).toBe(0)
    expect(JSON.parse(readFileSync(target, 'utf8')) as RedteamDataset).toEqual(baseDataset())
  })
})

describe('redteam dispatch', () => {
  it('reports usage for publish without arguments', () => {
    expect(silenceConsole(() => runRedteam(['publish']))).toBe(1)
  })

  it('rejects unknown commands', () => {
    expect(silenceConsole(() => runRedteam(['explode']))).toBe(1)
  })

  it('help exits cleanly', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      expect(runRedteam(['help'])).toBe(0)
      expect(runRedteam([])).toBe(0)
    } finally {
      spy.mockRestore()
    }
  })
})
