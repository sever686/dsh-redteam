# dsh-redteam

English | [中文](README.zh.md)

A red-team operations console plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) web GUI: a sidebar-foot trigger plus a full-screen console with six sections (dashboard, targets, jobs, sessions & implants, credentials, reports), a plugin-extensible section slot, a file-based data-pump channel, and a companion `redteam` CLI. Published here as a standalone snapshot of the `packages/client/ui-redteam` workspace package.

## Features

- **Zero-touch composition** — registers into the sidebar's `sidebar.footer.action` seat and the layout's additive `shell.overlay` layer; closed, the console renders nothing and never blocks the app underneath.
- **Extensible content** — the console declares the `redteam.section` slot; the six built-in sections register exactly like third-party ones, so new sections are a single `ctx.slots.inject('redteam.section', ...)` away.
- **Data pump** — polls same-origin `/redteam-data.json` (a file under the frontend dist root) every 5s, validates the payload member-by-member, and keeps the last good dataset on failure; bad data never reaches the screen.
- **Dark terminal aesthetic** — built entirely on `--dsw-*` semantic tokens (no literal colors), severity/state color+text double encoding, monospace fields, zh/en dictionaries.
- **`redteam` CLI** — zero-dependency bin for the pump file: `init` writes the schema-exact empty template, `publish` validates and copies a dataset into the dist root.

## Install

The package ships a self-enabling bundle patch, so a published install is one command:

```sh
dsh plugin --profile web add @deepseek-ai/dsh-client-ui-redteam
# restart dsh web — the sidebar foot gains the "Red Team Console" entry
```

Alternatives: `dsh web --patch <path-to>/redteam.patch.yml` per invocation, or append the row to `$DSH_HOME/cordis.patch.yml` once.

Installation prerequisites: the peer packages (`@deepseek-ai/dsh-client-runtime`, `-locale`, `-ui-layout`, `-ui-sidebar`, `-ui-primitives`, `-ui-slots`, `@deepseek-ai/cordis`, `@deepseek-ai/dsh-invariants`) must be resolvable — published from the monorepo with converted version ranges, or satisfied by the monorepo itself. `lib/` ships prebuilt in this repository, so git/file installs never need a build step.

## Data pump

```sh
redteam init                          # redteam-data.json — empty dataset template
# ... your scanning pipeline fills the file (targets / jobs / sessions / credentials / activity / coverage)
redteam merge <fragment.json> redteam-data.json   # upsert tool results (by id; coverage by tactic; activity newest-first)
redteam publish redteam-data.json <dsh-checkout>/apps/web/dist
```

The console picks the file up within one poll interval (5s). Note: `build:web` rewrites the dist and wipes the published file — re-run `publish` after frontend builds. The payload shape is `RedteamDataset` ([src/client/demo.ts](src/client/demo.ts)); row types are the production contracts a future `redteam` Host Remote domain fills without touching the sections.

### Agent loop (harness-native orchestration)

Inside dsh, the natural loop is: human command → the agent picks tools (e.g. Kali/Burp MCP) → results merge/publish into the console. The shipped [skill](skills/redteam-console-sync/SKILL.md) pins that procedure (scope check, dataset schema, merge semantics, publish path); copy it to `$DSH_HOME/skills/` and it appears in the agent's skill catalog for on-demand loading.

## Building and testing (monorepo context)

`src/` is byte-identical to the monorepo package and builds there:

```sh
# inside deepseek-harness, with this directory linked as packages/client/ui-redteam:
pnpm install
pnpm exec tsc -b packages/client/ui-redteam/tsconfig.json
pnpm --filter @deepseek-ai/dsh-client-ui-redteam bundle   # lib/index.js, lib/invariant.js, lib/client.js, lib/bin/redteam.js
pnpm exec vitest run packages/client/ui-redteam
pnpm exec oxlint packages/client/ui-redteam
```

The build imports the monorepo's shared tsdown preset (`packages/client/tsdown.client.ts`) and tsconfig bases, which are intentionally not vendored here — the committed `lib/` artifacts are the standalone-consumption path.

## Extension contract

```ts
ctx.slots.inject('redteam.section', () => ctx.slots.register({
  name: 'redteam.section',
  id: 'my-domain',            // nav key
  order: 100,                 // nav position
  label: () => t('my.nav'),   // locale-following thunk
  locale: 'my-namespace',
}, MySectionComponent))
```

The console projects ledger entries (cached per slots-version × locale-revision) into the nav rail and renders the active entry with the `only` filter.

## Known limitations

- The pump's file channel is interim; the production path is a `redteam` Host Remote domain (SSE/push) — the pump swaps without section changes.
- No interactive C2 terminal yet (sessions section is an inventory); no report generation wiring.
- Tests and builds require the monorepo context (see above).

## License

MIT. Derived from [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) (MIT).
