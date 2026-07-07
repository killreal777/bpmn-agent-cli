import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { listImplementations } from '../../query/implementations.js';
import type { ParsedArgs } from '../args.js';

export async function implementationsCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'implementations requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'implementations',
    file: args.file,
    result: listImplementations(buildIndexes(model), {
      type: typeof args.options.get('--type') === 'string' ? String(args.options.get('--type')) : undefined
    })
  });
}
