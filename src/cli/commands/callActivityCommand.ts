import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getCallActivities } from '../../query/callActivity.js';
import type { ParsedArgs } from '../args.js';

export async function callActivityCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'call-activity requires a BPMN file', 2);
  }

  const id = args.options.get('--id');
  if (id !== undefined && typeof id !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'call-activity --id requires a value', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'call-activity',
    file: args.file,
    result: getCallActivities(buildIndexes(model), { id })
  });
}
