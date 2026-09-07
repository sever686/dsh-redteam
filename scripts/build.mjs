/**
 * Build script for @dsh-external/dsh-redteam (external dsh plugin, no
 * monorepo toolchain): TypeScript declaration emit plus esbuild bundles.
 *
 *   lib/index.js      Host bundle (ESM; every @deepseek-ai package external)
 *   lib/invariant.js  Host invariant bundle (ESM)
 *   lib/bin/redteam.js  Companion `redteam` CLI (node, shebang)
 *   lib/client.js     Web client bundle (CJS, wrapped in
 *                     window.__ModuleLoader__.load; @deepseek-ai packages
 *                     resolve through the loader module table)
 *
 * CSS Modules: `*.module.css` imports compile to a hashed class map plus a
 * style tag injected once at factory execution (the shipped dsh client
 * bundle contract). The transform is deliberately small: this plugin's
 * stylesheets use flat kebab-case class selectors only — no @media,
 * @keyframes, :global, or url() tokens.
 */
import { rm, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import ts from 'typescript'

const PACKAGE_ID = '@dsh-external/dsh-redteam'

await rm('lib', { recursive: true, force: true })

// --- Declaration emit ------------------------------------------------------
{
  const rootNames = ts.sys.readDirectory('src', ['.ts', '.tsx'])
  const program = ts.createProgram({
    rootNames,
    options: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowImportingTsExtensions: true,
      lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noUncheckedIndexedAccess: true,
      skipLibCheck: true,
      verbatimModuleSyntax: true,
      types: ['node'],
      declaration: true,
      emitDeclarationOnly: true,
      outDir: 'lib/types',
      rootDir: 'src',
    },
  })
  const emit = program.emit()
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics)
  if (diagnostics.length > 0) {
    const host = {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }
    process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, host))
    process.exit(1)
  }
}

// --- CSS Modules plugin ----------------------------------------------------
/** Compile one `.module.css` into its class map and its rewritten stylesheet. */
function compileCssModule(source, fileId) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  /** @type {Record<string, string>} */
  const classMap = {}
  const css = withoutComments.replace(/\.([A-Za-z_][\w-]*)/g, (whole, name) => {
    const key = String(name)
    if (key.startsWith('--')) return whole
    let hashed = classMap[key]
    if (hashed === undefined) {
      const digest = createHash('sha256')
        .update(`${fileId}:${key}`)
        .digest('hex')
        .slice(0, 6)
      hashed = `drt-${key}-${digest}`
      classMap[key] = hashed
    }
    return `.${hashed}`
  })
  return { classMap, css }
}

/** @type {import('esbuild').Plugin} */
const cssModulesPlugin = {
  name: 'dsh-redteam-css-modules',
  setup(buildContext) {
    buildContext.onLoad({ filter: /\.module\.css$/ }, (args) => {
      const source = readFileSyncText(args.path)
      const { classMap, css } = compileCssModule(source, args.path)
      const tagId = JSON.stringify(`${PACKAGE_ID}/${args.path.split(/[\\/]/).pop()}`)
      const injection = [
        `const css = ${JSON.stringify(css)};`,
        `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(${tagId}) + ']') === null) {`,
        '  const tag = document.createElement(\'style\');',
        `  tag.dataset.plugin = ${JSON.stringify(PACKAGE_ID)};`,
        `  tag.dataset.pluginCss = ${tagId};`,
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
      ].join('\n')
      return {
        contents: `${injection}\nexport default ${JSON.stringify(classMap)};`,
        loader: 'js',
      }
    })
  },
}

function readFileSyncText(path) {
  return readFileSync(path, 'utf8')
}

// --- Host bundles ----------------------------------------------------------
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'lib/index.js',
  external: ['@deepseek-ai/*', 'cordis'],
})

await build({
  entryPoints: ['src/invariant.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'lib/invariant.js',
  external: ['@deepseek-ai/*', 'cordis'],
})

// --- Companion CLI ---------------------------------------------------------
await build({
  entryPoints: ['src/bin/redteam.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'lib/bin/redteam.js',
  banner: { js: '#!/usr/bin/env node' },
})

// --- Web client bundle -----------------------------------------------------
await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  outfile: 'lib/client.js',
  sourcemap: true,
  plugins: [cssModulesPlugin],
  external: ['react', 'react/jsx-runtime', '@deepseek-ai/*', 'cordis'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  banner: {
    js: [
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      'var module = { exports: {} }; var exports = module.exports;',
    ].join('\n'),
  },
  footer: {
    js: 'return module.exports; } });',
  },
})

for (const file of ['lib/index.js', 'lib/invariant.js', 'lib/client.js']) {
  const source = await readFile(file, 'utf8')
  await writeFile(file, source.replace(/[ \t]+$/gm, ''))
}

console.log(`[${PACKAGE_ID}] built Host, invariant, bin, and Web client bundles`)
