/**
 * `redteam` — companion CLI for the red-team console data pump.
 *
 * The console polls `/redteam-data.json`, a file inside the frontend dist
 * root. This CLI manages that file so external users run the whole pump with
 * two commands:
 *
 *   redteam init [file]                write the empty dataset template
 *   redteam publish <file> <distDir>   copy (validating) a dataset into the dist root
 *
 * Zero runtime dependencies (node builtins only). The dataset template is the
 * package's own EMPTY_DATASET, so the schema never drifts from the console's
 * contracts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EMPTY_DATASET } from '../client/demo.ts'

/** Dataset filename the console polls inside the dist root. */
export const PUMP_FILENAME = 'redteam-data.json'

/** Default output path of `redteam init`. */
export const DEFAULT_INIT_FILE = PUMP_FILENAME

function printHelp(): void {
  process.stdout.write(
    'redteam — companion CLI for the dsh red-team console data pump\n'
    + '\n'
    + '  redteam init [file]                 write the empty dataset template (default: redteam-data.json)\n'
    + '  redteam publish <file> <distDir>    validate and copy a dataset into the frontend dist root\n'
    + '  redteam help                        print this help\n'
    + '\n'
    + 'The console polls /redteam-data.json every 5s; publish lands the file\n'
    + 'where the frontend-static server exposes it.\n',
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

/** `redteam publish <file> <distDir>` — validate and copy into the dist root. */
export function publishDataset(source: string, distDir: string): number {
  const text = readFileSync(source, 'utf8')
  try {
    JSON.parse(text)
  } catch (error) {
    process.stderr.write(`redteam: ${source} is not valid JSON: ${String(error)}\n`)
    return 1
  }
  mkdirSync(distDir, { recursive: true })
  const target = join(distDir, PUMP_FILENAME)
  writeFileSync(target, text)
  process.stdout.write(`redteam: published ${resolve(source)} -> ${resolve(target)}\n`)
  return 0
}

/** Dispatch one CLI invocation. */
export function runRedteam(args: readonly string[]): number {
  const [command, ...rest] = args
  switch (command) {
    case 'init':
      return initDataset(rest[0] ?? DEFAULT_INIT_FILE)
    case 'publish': {
      const source = rest[0]
      const distDir = rest[1]
      if (source === undefined || distDir === undefined) {
        process.stderr.write('redteam: usage: redteam publish <data.json> <distDir>\n')
        return 1
      }
      return publishDataset(source, distDir)
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
