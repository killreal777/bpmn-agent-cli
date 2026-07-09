import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { buildReviewPacket } from '../../query/review.js';
import type { ParsedArgs } from '../args.js';

export async function reviewCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'review requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'review',
    file: args.file,
    result: buildReviewPacket(model)
  });
}
