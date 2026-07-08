import { execFile } from 'node:child_process';
import { chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('benchmark scripts', () => {
  it('declares benchmark npm scripts', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

    expect(packageJson.scripts.benchmark).toBe('node scripts/benchmark.mjs');
    expect(packageJson.scripts['benchmark:agent']).toBe('node scripts/benchmark-agent.mjs');
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

  it('runs an agent benchmark task through a CLI wrapper and scores the answer', async () => {
    const fakeAgentPath = 'tmp/fake-bpmn-agent.sh';
    const reportPath = 'tmp/agent-benchmark-smoke.json';
    const comparePath = 'tmp/agent-benchmark-compare-smoke.json';
    await rm(reportPath, { force: true });
    await rm(comparePath, { force: true });
    await writeFile(fakeAgentPath, [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'bpmn-agent-cli overview benchmarks/fixtures/simple-linear.bpmn >/tmp/fake-agent-overview.json',
      'printf "Task_DoWork uses workDelegate and does not read raw BPMN XML.\\n" > "$BPMN_AGENT_ANSWER_FILE"'
    ].join('\n'));
    await chmod(fakeAgentPath, 0o755);

    await execFileAsync('npm', [
      'run',
      'benchmark:agent',
      '--',
      '--variant',
      'agent-smoke',
      '--task',
      'T1-overview-linear',
      '--agent-command',
      fakeAgentPath,
      '--output',
      reportPath
    ], { timeout: 30000 });
    await execFileAsync('npm', ['run', 'benchmark:compare', '--', '--baseline', reportPath, '--candidate', reportPath, '--output', comparePath], { timeout: 20000 });

    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const compare = JSON.parse(await readFile(comparePath, 'utf8'));

    expect(report).toMatchObject({
      variant: 'agent-smoke',
      taskCount: 1,
      aggregate: {
        successfulTasks: 1,
        cliCalls: 1,
        xmlFallbackRate: 0,
        averageCorrectnessScore: 3
      }
    });
    expect(report.tasks[0]).toMatchObject({
      id: 'T1-overview-linear',
      cliCommand: expect.stringContaining('dist/cli/main.js'),
      success: true,
      answerCorrectnessScore: 3,
      cliCalls: [expect.objectContaining({ command: 'overview', exitCode: 0 })],
      xmlFallback: false
    });
    expect(compare.deltas).toMatchObject({
      averageCorrectnessScore: 0,
      answerCorrectnessScore: 0,
      estimatedAgentOutputTokens: 0
    });
  });
});
