import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { validateModel } from '../../validate/validateModel.js';
import type { ParsedArgs } from '../args.js';

export async function validateCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'validate requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  const indexes = buildIndexes(model);
  const result = validateModel(model, indexes);
  if (!result.valid) {
    process.exitCode = 1;
  }

  return successEnvelope({
    command: 'validate',
    file: args.file,
    result
  });
}
