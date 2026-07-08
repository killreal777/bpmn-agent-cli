import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type TraceMetricsEntry = {
  timestamp: string;
  command: string;
  fileHash: string | null;
  argsHash: string;
  durationMs: number;
  exitCode: number;
  stdoutBytes: number;
  estimatedOutputTokens: number;
  errorCode: string | null;
};

export type TraceMetricsInput = {
  command: string;
  file: string | null;
  args: string[];
  durationMs: number;
  exitCode: number;
  stdoutBytes: number;
  errorCode: string | null;
};

export function estimateTokens(textOrBytes: string | number): number {
  const length = typeof textOrBytes === 'number' ? textOrBytes : Buffer.byteLength(textOrBytes, 'utf8');
  return Math.ceil(length / 4);
}

function hash(value: string | Buffer): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export async function buildTraceMetricsEntry(input: TraceMetricsInput): Promise<TraceMetricsEntry> {
  const fileHash = input.file ? hash(await readFile(input.file)) : null;

  return {
    timestamp: new Date().toISOString(),
    command: input.command,
    fileHash,
    argsHash: hash(input.args.join('\0')),
    durationMs: input.durationMs,
    exitCode: input.exitCode,
    stdoutBytes: input.stdoutBytes,
    estimatedOutputTokens: estimateTokens(input.stdoutBytes),
    errorCode: input.errorCode
  };
}

export async function appendTraceMetricsEntry(path: string, entry: TraceMetricsEntry): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(entry)}\n`, 'utf8');
}
