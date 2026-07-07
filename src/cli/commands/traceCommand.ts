import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { trace } from '../../query/trace.js';
import type { ParsedArgs } from '../args.js';

export async function traceCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'trace requires a BPMN file', 2);
  }

  const from = args.options.get('--from');
  if (typeof from !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'trace requires --from', 2);
  }

  const direction = args.options.get('--direction');
  if (direction !== undefined && direction !== 'forward' && direction !== 'backward') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--direction must be forward or backward', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'trace',
    file: args.file,
    result: trace(buildIndexes(model), {
      from,
      direction: direction === 'backward' ? 'backward' : 'forward',
      depth: numberOption(args, '--depth', 5),
      maxPaths: numberOption(args, '--max-paths', 20)
    })
  });
}

function numberOption(args: ParsedArgs, name: string, fallback: number): number {
  const value = args.options.get(name);
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !Number.isInteger(Number(value)) || Number(value) < 0) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', `${name} must be a non-negative integer`, 2, { option: name, value });
  }
  return Number(value);
}
