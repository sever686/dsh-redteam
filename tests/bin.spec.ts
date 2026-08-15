/**
 * `redteam` CLI specs: init writes the six-array template and refuses
 * overwrites; publish validates JSON and copies into the dist root; unknown
 * commands and missing arguments fail loudly. Temp dirs per spec.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initDataset, publishDataset, PUMP_FILENAME, runRedteam } from '../src/bin/redteam.ts'

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
    expect(readFileSync(join(dist, PUMP_FILENAME), 'utf8')).toBe(readFileSync(source, 'utf8'))
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
    writeFileSync(source, '{}')
    const dist = join(dir, 'nested', 'dist')
    expect(publishDataset(source, dist)).toBe(0)
    expect(existsSync(join(dist, PUMP_FILENAME))).toBe(true)
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
