import type { UserConfig } from 'tsdown'
import { clientBundle } from '../tsdown.client.ts'

/** Companion bin build: the `redteam` CLI, node-only, zero external deps. */
const bin: UserConfig = {
  name: '@deepseek-ai/dsh-client-ui-redteam/bin',
  entry: { 'bin/redteam': 'src/bin/redteam.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  banner: '#!/usr/bin/env node',
}

export default clientBundle(
  '@deepseek-ai/dsh-client-ui-redteam',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { companions: [bin] },
)
