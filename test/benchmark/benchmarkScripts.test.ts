import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('benchmark scripts', () => {
  it('declares benchmark npm scripts', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    expect(packageJson.scripts.benchmark).toBe('node scripts/benchmark.mjs');
    expect(packageJson.scripts['benchmark:compare']).toBe('node scripts/benchmark-compare.mjs');
  });

  it('runs a smoke benchmark task and compares reports', async () => {
    const reportPath = 'tmp/benchmark-smoke.json';
    const comparePath = 'tmp/benchmark-compare-smoke.json';
    await rm(reportPath, { force: true });
    await rm(comparePath, { force: true });

    await execFileAsync('npm', ['run', 'benchmark', '--', '--variant', 'smoke', '--task', 'T1-overview-linear', '--output', reportPath], { timeout: 20000 });
    await execFileAsync('npm', ['run', 'benchmark:compare', '--', '--baseline', reportPath, '--candidate', reportPath, '--output', comparePath], { timeout: 20000 });

    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const compare = JSON.parse(await readFile(comparePath, 'utf8'));

    expect(report).toMatchObject({
      variant: 'smoke',
      taskCount: 1,
      aggregate: {
        cliCalls: expect.any(Number),
        successfulTasks: expect.any(Number),
        estimatedOutputTokens: expect.any(Number)
      }
    });
    expect(report.tasks[0]).toMatchObject({
      id: 'T1-overview-linear',
      fixture: 'simple-linear.bpmn',
      cliCalls: expect.any(Array)
    });
    expect(compare).toMatchObject({
      baseline: { variant: 'smoke' },
      candidate: { variant: 'smoke' },
      deltas: {
        estimatedOutputTokens: 0,
        successfulTasks: 0
      }
    });
  });
});
