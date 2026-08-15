// @vitest-environment jsdom
/**
 * Data-pump specs: fetch success validates and returns the dataset, a failed
 * FIRST fetch yields undefined (the store stays empty), later failures keep
 * the last good dataset, and malformed payloads are rejected.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RedteamDataPump } from '../src/client/pump.ts'
import type { RedteamDataset } from '../src/client/demo.ts'
import { EMPTY_DATASET } from '../src/client/demo.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const DATASET: RedteamDataset = {
  ...EMPTY_DATASET,
  targets: [
    {
      id: 't-1', address: '127.0.0.1', kind: 'targets.kind.host', os: 'Linux',
      ports: '22/tcp', rights: 'targets.rights.none', state: 'targets.state.recon',
      inScope: true, owner: 'pump',
    },
  ],
}

function stubFetch(result: { ok: boolean; json: unknown } | 'reject'): void {
  const fetchMock = vi.fn(async () => {
    if (result === 'reject') throw new Error('network down')
    return { ok: result.ok, json: async () => result.json } as Response
  })
  vi.stubGlobal('fetch', fetchMock)
}

describe('RedteamDataPump', () => {
  it('returns the validated dataset on success', async () => {
    stubFetch({ ok: true, json: DATASET })
    const pump = new RedteamDataPump()
    await expect(pump.fetchDataset()).resolves.toEqual(DATASET)
  })

  it('returns undefined before the first success', async () => {
    stubFetch('reject')
    const pump = new RedteamDataPump()
    await expect(pump.fetchDataset()).resolves.toBeUndefined()
  })

  it('keeps the last good dataset when a later fetch fails', async () => {
    stubFetch({ ok: true, json: DATASET })
    const pump = new RedteamDataPump()
    await pump.fetchDataset()
    stubFetch('reject')
    await expect(pump.fetchDataset()).resolves.toEqual(DATASET)
  })

  it('rejects a malformed payload and keeps the last good dataset', async () => {
    stubFetch({ ok: true, json: DATASET })
    const pump = new RedteamDataPump()
    await pump.fetchDataset()
    stubFetch({ ok: true, json: { targets: 'not-an-array' } })
    await expect(pump.fetchDataset()).resolves.toEqual(DATASET)
  })

  it('rejects a non-ok response and keeps the last good dataset', async () => {
    stubFetch({ ok: true, json: DATASET })
    const pump = new RedteamDataPump()
    await pump.fetchDataset()
    stubFetch({ ok: false, json: null })
    await expect(pump.fetchDataset()).resolves.toEqual(DATASET)
  })
})
