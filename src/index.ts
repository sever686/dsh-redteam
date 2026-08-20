/**
 * Red-team operations console plugin, node half: the target-deletion route
 * POST /redteam-target-delete. Removes one target row and every row that
 * references its address (jobs, sessions, credentials, activity) from BOTH
 * the deployment source file (REDTEAM_DATA_FILE) and the published dist copy
 * the data pump serves (REDTEAM_DATA_DIST), so a later `redteam publish`
 * cannot resurrect deleted rows.
 * @module @deepseek-ai/dsh-client-ui-redteam
 */
import { readFile, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'

export const name = 'client-ui-redteam'
export const inject = ['webServer']

/** Deployment-local file paths, env-overridable. */
const SOURCE_FILE = process.env.REDTEAM_DATA_FILE ?? 'C:\\Users\\jie\\redteam-data.json'
const DIST_FILE = process.env.REDTEAM_DATA_DIST ?? 'D:\\27656\\Documents\\deepseek-harness\\apps\\web\\dist\\redteam-data.json'

interface TargetLike { readonly id: string; readonly address: string }
interface DatasetLike {
  targets: readonly TargetLike[]
  jobs: ReadonlyArray<{ readonly target?: string }>
  sessions: ReadonlyArray<{ readonly host?: string }>
  credentials: ReadonlyArray<{ readonly hosts?: string }>
  activity: ReadonlyArray<{ readonly target?: string }>
}

interface RemoveCounts {
  readonly targets: number
  readonly jobs: number
  readonly sessions: number
  readonly credentials: number
  readonly activity: number
}

function isDataset(value: unknown): value is DatasetLike {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return Array.isArray(candidate.targets)
    && Array.isArray(candidate.jobs)
    && Array.isArray(candidate.sessions)
    && Array.isArray(candidate.credentials)
    && Array.isArray(candidate.activity)
    && Array.isArray(candidate.coverage)
}

function removeTargetRows(dataset: DatasetLike, id: string): { dataset: DatasetLike; counts: RemoveCounts } | undefined {
  const target = dataset.targets.find(row => row.id === id)
  if (target === undefined) return undefined
  const address = target.address
  const next: DatasetLike = {
    ...dataset,
    targets: dataset.targets.filter(row => row.id !== id),
    jobs: dataset.jobs.filter(row => row.target !== address),
    sessions: dataset.sessions.filter(row => row.host !== address),
    credentials: dataset.credentials.filter(row => row.hosts !== address),
    activity: dataset.activity.filter(row => row.target !== address),
  }
  return {
    dataset: next,
    counts: {
      targets: 1,
      jobs: dataset.jobs.length - next.jobs.length,
      sessions: dataset.sessions.length - next.sessions.length,
      credentials: dataset.credentials.length - next.credentials.length,
      activity: dataset.activity.length - next.activity.length,
    },
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
  return Buffer.concat(chunks).toString('utf8')
}

async function loadDataset(): Promise<{ dataset: DatasetLike; sourcePath?: string; distPath: string } | undefined> {
  for (const path of [SOURCE_FILE, DIST_FILE]) {
    try {
      const text = await readFile(path, 'utf8')
      const parsed: unknown = JSON.parse(text)
      if (!isDataset(parsed)) continue
      return path === SOURCE_FILE
        ? { dataset: parsed, sourcePath: SOURCE_FILE, distPath: DIST_FILE }
        : { dataset: parsed, distPath: DIST_FILE }
    } catch {
      // unreadable or invalid - try the next copy
    }
  }
  return undefined
}

function respond(res: ServerResponse, status: number, value: object): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/**
 * Register the deletion route on the composed webServer.
 * @param ctx - host context carrying the webServer service.
 */
export function apply(ctx: Context): void {
  const host = ctx as unknown as { webServer: WebServerLike }
  ctx.effect(() => host.webServer.register({
    kind: 'exact',
    path: '/redteam-target-delete',
    handler: async (req, res) => {
      if (req.method !== 'POST') {
        respond(res, 405, { error: 'method-not-allowed' })
        return
      }
      try {
        const raw = await readBody(req)
        const payload = JSON.parse(raw) as { id?: unknown }
        const id = typeof payload.id === 'string' ? payload.id : ''
        if (id === '') {
          respond(res, 400, { error: 'missing target id' })
          return
        }
        const loaded = await loadDataset()
        if (loaded === undefined) {
          respond(res, 404, { error: 'dataset file not found or invalid' })
          return
        }
        const result = removeTargetRows(loaded.dataset, id)
        if (result === undefined) {
          respond(res, 404, { error: 'target not found' })
          return
        }
        const files: string[] = []
        if (loaded.sourcePath !== undefined) {
          await writeFile(loaded.sourcePath, JSON.stringify(result.dataset, null, 2))
          files.push('source')
        }
        await writeFile(loaded.distPath, JSON.stringify(result.dataset, null, 2))
        files.push('dist')
        respond(res, 200, { ok: true, removed: result.counts, files })
      } catch (error) {
        respond(res, 500, { error: String(error) })
      }
    },
  }), 'ui-redteam: target-delete route')
}