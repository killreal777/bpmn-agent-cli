import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist/extension', { recursive: true });

await build({
  entryPoints: ['src/cli/main.ts'],
  outfile: 'dist/extension/bpmn-agent-cli.cjs',
  bundle: true,
  platform: 'node',
  target: ['node20'],
  format: 'cjs',
  external: [],
  logLevel: 'info'
});
