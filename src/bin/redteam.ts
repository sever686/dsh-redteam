/**
 * `redteam` — companion CLI for the red-team console data pump.
 *
 * The console polls `/redteam-data.json`, a file inside the frontend dist
 * root. This CLI manages that file so external users run the whole pump with
 * three commands:
 *
 *   redteam init [file]                        write the empty dataset template
 *   redteam merge <fragment.json> <file>       upsert rows into a dataset file
 *   redteam publish <file> <distDir>           copy (validating) a dataset into the dist root
 *   redteam import-nmap <scan.xml> [file]      convert nmap XML into rows (merge when file given)
 *   redteam import-nuclei <scan.jsonl> [file]  convert nuclei JSONL into activity rows
 *   redteam import-burp <issues.json> [file]   convert Burp scanner issues into activity rows
 *
 * Zero runtime dependencies (node builtins only). The dataset template is the
 * package's own EMPTY_DATASET, so the schema never drifts from the console's
 * contracts. `merge` is the scanning-pipeline primitive: tool results land as
 * fragments and are upserted without clobbering existing rows. The `import-*`
 * commands are the deterministic adapters for that pipeline: raw tool output
 * becomes fragment rows without a model hand-translating field mappings.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EMPTY_DATASET, type ActivityEvent, type RedteamDataset, type Severity, type TargetRow } from '../client/demo.ts'

/** Dataset filename the console polls inside the dist root. */
export const PUMP_FILENAME = 'redteam-data.json'

/** Default output path of `redteam init`. */
export const DEFAULT_INIT_FILE = PUMP_FILENAME

/** The six dataset array keys, in canonical order. */
const DATASET_KEYS = ['targets', 'jobs', 'sessions', 'credentials', 'activity', 'coverage'] as const

/** Narrow an unknown JSON value to a dataset with all six arrays. */
function isDataset(value: unknown): value is RedteamDataset {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return DATASET_KEYS.every(key => Array.isArray(candidate[key]))
}

/**
 * Narrow an unknown JSON value to a partial dataset fragment: every PRESENT
 * key must be one of the six dataset arrays (absent keys are kept from the
 * base). Empty fragments are valid no-ops.
 */
function isFragment(value: unknown): value is Partial<RedteamDataset> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  for (const [key, member] of Object.entries(candidate)) {
    if (!(DATASET_KEYS as readonly string[]).includes(key)) return false
    if (!Array.isArray(member)) return false
  }
  return true
}

/** Upsert rows by their `id` field; fragment rows win over same-id base rows. */
function upsertById<T extends { id: string | number }>(base: readonly T[], fragment: readonly T[]): T[] {
  const byId = new Map<T['id'], T>(base.map(row => [row.id, row]))
  for (const row of fragment) byId.set(row.id, row)
  return [...byId.values()]
}

/** Descending activity order: numeric ids count down, non-numeric fall back to lexicographic desc. */
function newestFirst(rows: { id: string | number }[]): void {
  rows.sort((left, right) => {
    const leftN = Number(left.id)
    const rightN = Number(right.id)
    if (!Number.isNaN(leftN) && !Number.isNaN(rightN)) return rightN - leftN
    return String(right.id).localeCompare(String(left.id))
  })
}

/** Upsert coverage rows by their `tactic` field. */
function upsertByTactic<T extends { tactic: string }>(base: readonly T[], fragment: readonly T[]): T[] {
  const byTactic = new Map(base.map(row => [row.tactic, row]))
  for (const row of fragment) byTactic.set(row.tactic, row)
  return [...byTactic.values()]
}

/**
 * Merge a fragment into a base dataset: targets/jobs/sessions/credentials
 * upsert by id, activity upserts by id then re-orders newest-first, coverage
 * upserts by tactic. Absent fragment keys keep the base arrays.
 * @param base - the current dataset.
 * @param fragment - the tool-result fragment (partial allowed).
 * @returns the merged dataset.
 */
export function mergeDatasets(base: RedteamDataset, fragment: Partial<RedteamDataset>): RedteamDataset {
  const targets = fragment.targets === undefined ? base.targets : upsertById(base.targets, fragment.targets)
  const jobs = fragment.jobs === undefined ? base.jobs : upsertById(base.jobs, fragment.jobs)
  const sessions = fragment.sessions === undefined ? base.sessions : upsertById(base.sessions, fragment.sessions)
  const credentials = fragment.credentials === undefined
    ? base.credentials
    : upsertById(base.credentials, fragment.credentials)
  const activity = fragment.activity === undefined
    ? base.activity
    : (() => {
      const merged = upsertById(base.activity, fragment.activity)
      newestFirst(merged)
      return merged
    })()
  const coverage = fragment.coverage === undefined
    ? base.coverage
    : upsertByTactic(base.coverage, fragment.coverage)
  return { targets, jobs, sessions, credentials, activity, coverage }
}

/** Strip a leading UTF-8 BOM: Windows editors/tools commonly prepend one. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
}

/** Parse and shape-check one dataset JSON file; writes diagnostics and returns undefined on failure. */
function readDataset(path: string): RedteamDataset | undefined {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    process.stderr.write(`redteam: cannot read ${path}\n`)
    return undefined
  }
  let value: unknown
  try {
    value = JSON.parse(stripBom(text))
  } catch (error) {
    process.stderr.write(`redteam: ${path} is not valid JSON: ${String(error)}\n`)
    return undefined
  }
  if (!isDataset(value)) {
    process.stderr.write(`redteam: ${path} is not a dataset (needs the six array members)\n`)
    return undefined
  }
  return value
}

/** Local-time `HH:mm` stamp for generated activity rows. */
function localTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

/**
 * Seed generated activity ids past a dataset's current maximum numeric id so
 * imported events never collide with (and therefore overwrite) live rows.
 */
function seedActivityIds(events: ActivityEvent[], base: RedteamDataset | undefined): void {
  let next = 1
  if (base !== undefined) {
    for (const row of base.activity) {
      const n = row.id
      if (!Number.isNaN(n) && n >= next) next = n + 1
    }
  }
  for (const event of events) event.id = next++
}

/** Normalize an unknown severity string onto the five-level console axis. */
function normalizeSeverity(value: unknown): Severity {
  const text = (typeof value === 'string' ? value : '').toLowerCase()
  if (text === 'critical' || text === 'high' || text === 'medium' || text === 'low') return text
  return 'info'
}

/**
 * Pick the first string-valued key from an unknown record, skipping any value
 * that is not a string. Defensive against untyped JSON where adversarial or
 * non-standard payloads could otherwise surface as "[object Object]".
 */
function pickString(record: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') return value
  }
  return ''
}

/** Decode the XML entities nmap output uses inside attribute values. */
function xmlAttr(value: string): string {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

/**
 * Convert `nmap -oX` output into fragment rows: one target per scanned host
 * (open ports as a `proto/port` list, first osmatch as the OS hint) plus one
 * info scan event per host. Host ids are `nmap:<ip>`, so re-importing the
 * same scan upserts instead of duplicating. Regex-scoped to nmap's flat,
 * stable host/port structure — no XML dependency is pulled in.
 */
export function parseNmapXml(text: string): Partial<RedteamDataset> {
  const targets: TargetRow[] = []
  const activity: ActivityEvent[] = []
  const time = localTime()
  for (const hostMatch of text.matchAll(/<host[\s>][\s\S]*?<\/host>/g)) {
    const host = hostMatch[0]
    const address = xmlAttr(host.match(/<address\s+addr="([^"]+)"\s+addrtype="(?:ipv4|ipv6)"/)?.[1] ?? '')
    if (address === '') continue
    const ports: string[] = []
    for (const portMatch of host.matchAll(/<port\s+protocol="(\w+)"\s+portid="(\d+)"[^>]*>([\s\S]*?)<\/port>/g)) {
      if (/<state\s+state="open"/.test(portMatch[3] ?? '' )) ports.push(`${portMatch[2] ?? ''}/${portMatch[1] ?? ''}`)
    }
    const os = xmlAttr(host.match(/<osmatch\s+name="([^"]+)"/)?.[1] ?? '')
    const hostname = xmlAttr(host.match(/<hostname\s+type="(?:PTR|user)"\s+name="([^"]+)"/)?.[1] ?? host.match(/<hostname\s+name="([^"]+)"/)?.[1] ?? '')
    targets.push({
      id: `nmap:${address}`,
      address,
      kind: 'targets.kind.host',
      os: os === '' ? null : os,
      ports: ports.join(', '),
      rights: 'targets.rights.none',
      state: 'targets.state.recon',
      inScope: true,
      owner: hostname === '' ? 'nmap' : hostname,
    })
    activity.push({ id: 0, time, severity: 'info', action: 'activity.action.scan', target: address })
  }
  return { targets, activity }
}

/**
 * Convert nuclei JSONL (`nuclei -j`) output into activity rows: one recon
 * event per unique template/host hit, severity passed through nuclei's own
 * five levels. Malformed lines are skipped rather than failing the file.
 */
export function parseNucleiJsonl(text: string): Partial<RedteamDataset> {
  const activity: ActivityEvent[] = []
  const seen = new Set<string>()
  const time = localTime()
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      continue
    }
    const templateId = pickString(entry, ['template-id', 'templateID', 'template', 'id'])
    const host = pickString(entry, ['host', 'url'])
    const key = `${templateId}|${host}`
    if (templateId === '' || host === '' || seen.has(key)) continue
    seen.add(key)
    const info = (entry.info ?? {}) as Record<string, unknown>
    activity.push({
      id: 0,
      time,
      severity: normalizeSeverity(info.severity),
      action: 'activity.action.recon',
      target: host,
    })
  }
  return { activity }
}

/**
 * Convert Burp scanner issues (an array, or `{ issues: [...] }`) into
 * activity rows: one breach event per unique name/target, mapping Burp's
 * severity scale (informational → info). Field names are matched
 * defensively so both the MCP tool output and Burp exports parse. Returns
 * undefined when the file is not JSON — imports fail loudly, not silently.
 */
export function parseBurpIssues(text: string): Partial<RedteamDataset> | undefined {
  let value: unknown
  try {
    value = JSON.parse(stripBom(text))
  } catch {
    return undefined
  }
  const raw = Array.isArray(value) ? value : ((value as { issues?: unknown[] }).issues ?? [])
  const activity: ActivityEvent[] = []
  const seen = new Set<string>()
  const time = localTime()
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const record = item as Record<string, unknown>
    const name = pickString(record, ['name', 'issueName', 'issue', 'title'])
    const target = pickString(record, ['host', 'origin', 'baseUrl', 'url'])
    const key = `${name}|${target}`
    if (name === '' || target === '' || seen.has(key)) continue
    seen.add(key)
    activity.push({
      id: 0,
      time,
      severity: normalizeSeverity(record.severity),
      action: 'activity.action.breach',
      target,
    })
  }
  return { activity }
}

/**
 * Shared `import-*` dispatch: parse the input file, then either merge into
 * the given dataset file (in place, ids seeded past the current max) or
 * print the fragment to stdout for redirection.
 */
function importToolOutput(
  inputPath: string,
  targetPath: string | undefined,
  parse: (text: string) => Partial<RedteamDataset> | undefined,
): number {
  let text: string
  try {
    text = readFileSync(inputPath, 'utf8')
  } catch {
    process.stderr.write(`redteam: cannot read ${inputPath}\n`)
    return 1
  }
  const fragment = parse(text)
  if (fragment === undefined) {
    process.stderr.write(`redteam: ${inputPath} is not a recognized tool export (parse failed)\n`)
    return 1
  }
  if (targetPath === undefined) {
    seedActivityIds([...(fragment.activity ?? [])], undefined)
    process.stdout.write(`${JSON.stringify(fragment, null, 2)}\n`)
    return 0
  }
  const base = readDataset(targetPath)
  if (base === undefined) return 1
  seedActivityIds([...(fragment.activity ?? [])], base)
  const merged = mergeDatasets(base, fragment)
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`)
  const rows = Object.entries(fragment).map(([key, list]) => `${(list as unknown[]).length} ${key}`).join(', ')
  process.stdout.write(`redteam: imported ${resolve(inputPath)} into ${resolve(targetPath)} (${rows})\n`)
  return 0
}

function printHelp(): void {
  process.stdout.write(
    'redteam — companion CLI for the dsh red-team console data pump\n'
    + '\n'
    + '  redteam init [file]                    write the empty dataset template (default: redteam-data.json)\n'
    + '  redteam merge <fragment.json> <file>   upsert rows from a fragment into a dataset file (in place)\n'
    + '  redteam publish <file> <distDir>       validate and copy a dataset into the frontend dist root\n'
    + '  redteam import-nmap <scan.xml> [file]  nmap -oX output → targets + scan events (merge when file given, else print fragment)\n'
    + '  redteam import-nuclei <scan> [file]    nuclei -j JSONL output → recon activity (merge when file given)\n'
    + '  redteam import-burp <issues> [file]    Burp scanner issues JSON → breach activity (merge when file given)\n'
    + '  redteam help                           print this help\n'
    + '\n'
    + 'The console polls /redteam-data.json every 5s; publish lands the file\n'
    + 'where the frontend-static server exposes it. merge semantics: rows\n'
    + 'upsert by id (coverage by tactic); activity re-orders newest-first.\n'
    + 'import-* activity ids are seeded past the dataset\'s current max.\n',
  )
}

/** `redteam init [file]` — write the empty dataset template. */
export function initDataset(target: string): number {
  if (existsSync(target)) {
    process.stderr.write(`redteam: ${target} already exists (refusing to overwrite)\n`)
    return 1
  }
  writeFileSync(target, `${JSON.stringify(EMPTY_DATASET, null, 2)}\n`)
  process.stdout.write(`redteam: wrote empty dataset to ${resolve(target)}\n`)
  return 0
}

/** `redteam merge <fragment.json> <file>` — upsert a fragment into the dataset file. */
export function mergeIntoDataset(fragmentPath: string, targetPath: string): number {
  let text: string
  try {
    text = readFileSync(fragmentPath, 'utf8')
  } catch {
    process.stderr.write(`redteam: cannot read fragment ${fragmentPath}\n`)
    return 1
  }
  let fragment: unknown
  try {
    fragment = JSON.parse(stripBom(text))
  } catch (error) {
    process.stderr.write(`redteam: ${fragmentPath} is not valid JSON: ${String(error)}\n`)
    return 1
  }
  if (!isFragment(fragment)) {
    process.stderr.write(`redteam: ${fragmentPath} is not a dataset fragment (present members must be the six dataset arrays)\n`)
    return 1
  }
  const base = readDataset(targetPath)
  if (base === undefined) return 1
  const merged = mergeDatasets(base, fragment)
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`)
  process.stdout.write(`redteam: merged ${resolve(fragmentPath)} into ${resolve(targetPath)}\n`)
  return 0
}

/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
export function publishDataset(source: string, distDir: string): number {
  const dataset = readDataset(source)
  if (dataset === undefined) return 1
  mkdirSync(distDir, { recursive: true })
  const target = join(distDir, PUMP_FILENAME)
  writeFileSync(target, `${JSON.stringify(dataset, null, 2)}\n`)
  process.stdout.write(`redteam: published ${resolve(source)} -> ${resolve(target)}\n`)
  return 0
}

/** Dispatch one CLI invocation. */
export function runRedteam(args: readonly string[]): number {
  const [command, ...rest] = args
  switch (command) {
    case 'init':
      return initDataset(rest[0] ?? DEFAULT_INIT_FILE)
    case 'merge': {
      const fragment = rest[0]
      const target = rest[1]
      if (fragment === undefined || target === undefined) {
        process.stderr.write('redteam: usage: redteam merge <fragment.json> <dataset.json>\n')
        return 1
      }
      return mergeIntoDataset(fragment, target)
    }
    case 'publish': {
      const source = rest[0]
      const distDir = rest[1]
      if (source === undefined || distDir === undefined) {
        process.stderr.write('redteam: usage: redteam publish <data.json> <distDir>\n')
        return 1
      }
      return publishDataset(source, distDir)
    }
    case 'import-nmap':
    case 'import-nuclei':
    case 'import-burp': {
      const input = rest[0]
      if (input === undefined) {
        process.stderr.write(`redteam: usage: redteam ${command} <input> [dataset.json]\n`)
        return 1
      }
      const parse = command === 'import-nmap' ? parseNmapXml : command === 'import-nuclei' ? parseNucleiJsonl : parseBurpIssues
      return importToolOutput(input, rest[1], parse)
    }
    case 'help':
    case undefined:
      printHelp()
      return 0
    default:
      process.stderr.write(`redteam: unknown command "${command}"\n`)
      printHelp()
      return 1
  }
}

const invokedPath = process.argv[1]
const isMain = invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href
if (isMain) {
  process.exit(runRedteam(process.argv.slice(2)))
}
