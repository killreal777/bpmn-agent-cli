import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getContext } from '../../query/context.js';
import type { ParsedArgs } from '../args.js';

export async function contextCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'context requires a BPMN file', 2);
  }

  const id = args.options.get('--id');
  if (typeof id !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'context requires --id', 2);
  }
  const profile = args.options.get('--profile');
  if (profile !== undefined && profile !== 'full' && profile !== 'agent') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'context --profile must be full or agent', 2, { option: '--profile', value: profile });
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'context',
    file: args.file,
    result: getContext(buildIndexes(model), {
      id,
      before: numberOption(args, '--before', 2),
      after: numberOption(args, '--after', 2),
      maxPaths: numberOption(args, '--max-paths', 20),
      profile
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
