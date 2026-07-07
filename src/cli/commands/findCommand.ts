import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { findElements } from '../../query/findElements.js';
import type { ParsedArgs } from '../args.js';

export async function findCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'find requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  return successEnvelope({
    command: 'find',
    file: args.file,
    result: findElements(indexes, {
      query: stringOption(args, '--query'),
      id: stringOption(args, '--id'),
      name: stringOption(args, '--name'),
      type: stringOption(args, '--type'),
      processId: stringOption(args, '--process'),
      limit: numberOption(args, '--limit', 20)
    })
  });
}

function stringOption(args: ParsedArgs, name: string): string | undefined {
  const value = args.options.get(name);
  return typeof value === 'string' ? value : undefined;
}

function numberOption(args: ParsedArgs, name: string, fallback: number): number {
  const value = stringOption(args, name);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', `${name} must be a non-negative integer`, 2, { option: name, value });
  }

  return parsed;
}
