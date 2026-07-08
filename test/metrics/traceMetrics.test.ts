import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { appendTraceMetricsEntry, buildTraceMetricsEntry, estimateTokens } from '../../src/metrics/traceMetrics.js';

describe('trace metrics', () => {
  it('estimates output tokens from text length', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('1234')).toBe(1);
    expect(estimateTokens('12345')).toBe(2);
  });

  it('builds privacy-preserving trace entries', async () => {
    await mkdir('tmp/metrics-test', { recursive: true });
    const fixture = 'tmp/metrics-test/private-process.bpmn';
    await writeFile(fixture, '<secret id="CustomerPrivateProcess" />');

    const entry = await buildTraceMetricsEntry({
      command: 'overview',
      file: fixture,
      args: ['overview', fixture, '--query', 'Sensitive Customer Name'],
      durationMs: 42,
      exitCode: 0,
      stdoutBytes: 3412,
      errorCode: null
    });

    expect(entry).toMatchObject({
      command: 'overview',
      fileHash: `sha256:${createHash('sha256').update('<secret id="CustomerPrivateProcess" />').digest('hex')}`,
      argsHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      durationMs: 42,
      exitCode: 0,
      stdoutBytes: 3412,
      estimatedOutputTokens: 853,
      errorCode: null
    });
    expect(JSON.stringify(entry)).not.toContain('CustomerPrivateProcess');
    expect(JSON.stringify(entry)).not.toContain('Sensitive Customer Name');
  });

  it('appends metrics entries as JSONL', async () => {
    await rm('tmp/metrics-test', { recursive: true, force: true });
    await mkdir('tmp/metrics-test', { recursive: true });
    const output = 'tmp/metrics-test/metrics.jsonl';

    await appendTraceMetricsEntry(output, {
      timestamp: '2026-07-08T00:00:00.000Z',
      command: 'overview',
      fileHash: null,
      argsHash: 'sha256:abc',
      durationMs: 1,
      exitCode: 0,
      stdoutBytes: 4,
      estimatedOutputTokens: 1,
      errorCode: null
    });
    await appendTraceMetricsEntry(output, {
      timestamp: '2026-07-08T00:00:01.000Z',
      command: 'validate',
      fileHash: null,
      argsHash: 'sha256:def',
      durationMs: 2,
      exitCode: 1,
      stdoutBytes: 8,
      estimatedOutputTokens: 2,
      errorCode: 'PARSE_ERROR'
    });

    const lines = (await readFile(output, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ command: 'overview', argsHash: 'sha256:abc' });
    expect(lines[1]).toMatchObject({ command: 'validate', errorCode: 'PARSE_ERROR' });
  });
});
