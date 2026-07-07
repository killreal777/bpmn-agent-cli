import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getOverview } from '../../query/overview.js';
import type { ParsedArgs } from '../args.js';

export async function overviewCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'overview requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  return successEnvelope({
    command: 'overview',
    file: args.file,
    result: getOverview(model, indexes)
  });
}
