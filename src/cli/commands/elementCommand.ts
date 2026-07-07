import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getElement } from '../../query/element.js';
import type { ParsedArgs } from '../args.js';

export async function elementCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'element requires a BPMN file', 2);
  }

  const id = args.options.get('--id');
  if (typeof id !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'element requires --id', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'element',
    file: args.file,
    result: getElement(buildIndexes(model), { id })
  });
}
