import { BpmnCliError } from '../bpmn/errors.js';

export function successEnvelope(args: { command: string; file: string | null; result: unknown }): unknown {
  return {
    ok: true,
    command: args.command,
    file: args.file,
    result: args.result
  };
}

export function errorEnvelope(error: unknown): unknown {
  if (error instanceof BpmnCliError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        suggestions: error.suggestions
      }
    };
  }

  return {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : String(error),
      details: {},
      suggestions: []
    }
  };
}

export function toExitCode(error: unknown): number {
  return error instanceof BpmnCliError ? error.exitCode : 5;
}

export function writeJson(value: unknown, pretty = false): void {
  process.stdout.write(`${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}
