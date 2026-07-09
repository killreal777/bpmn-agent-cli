import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getImpact } from '../../query/impact.js';
import type { ParsedArgs } from '../args.js';

export async function impactCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'impact requires a BPMN file', 2);
  }

  const id = args.options.get('--id');
  if (typeof id !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'impact requires --id', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'impact',
    file: args.file,
    result: getImpact(buildIndexes(model), {
      id,
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
