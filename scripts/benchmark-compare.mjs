import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function parseArgs(argv) {
  const options = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options.set(item, next);
      index += 1;
    } else {
      options.set(item, true);
    }
  }

  return options;
}

function delta(candidate, baseline, key) {
  return (candidate.aggregate[key] ?? 0) - (baseline.aggregate[key] ?? 0);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baselinePath = options.get('--baseline');
  const candidatePath = options.get('--candidate');
  const output = options.get('--output') ?? null;

  if (!baselinePath || !candidatePath) {
    throw new Error('Usage: npm run benchmark:compare -- --baseline <file> --candidate <file> [--output <file>]');
  }

  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  const candidate = JSON.parse(await readFile(candidatePath, 'utf8'));
  const comparison = {
    generatedAt: new Date().toISOString(),
    baseline: {
      variant: baseline.variant,
      taskCount: baseline.taskCount,
      aggregate: baseline.aggregate
    },
    candidate: {
      variant: candidate.variant,
      taskCount: candidate.taskCount,
      aggregate: candidate.aggregate
    },
    deltas: {
      successfulTasks: delta(candidate, baseline, 'successfulTasks'),
      successRate: delta(candidate, baseline, 'successRate'),
      cliCalls: delta(candidate, baseline, 'cliCalls'),
      elapsedMs: delta(candidate, baseline, 'elapsedMs'),
      stdoutBytes: delta(candidate, baseline, 'stdoutBytes'),
      estimatedOutputTokens: delta(candidate, baseline, 'estimatedOutputTokens'),
      xmlFallbackRate: delta(candidate, baseline, 'xmlFallbackRate'),
      toolErrors: delta(candidate, baseline, 'toolErrors'),
      toolErrorRate: delta(candidate, baseline, 'toolErrorRate')
    }
  };

  const serialized = `${JSON.stringify(comparison, null, 2)}\n`;
  if (output) {
    await mkdir(join(output, '..'), { recursive: true });
    await writeFile(output, serialized, 'utf8');
  }
  process.stdout.write(serialized);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
