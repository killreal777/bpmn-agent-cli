import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getVariables } from '../../query/variables.js';
import type { ParsedArgs } from '../args.js';

export async function variablesCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'variables requires a BPMN file', 2);
  }

  const element = args.options.get('--element');
  const name = args.options.get('--name');

  if (element !== undefined && typeof element !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'variables --element requires a value', 2);
  }

  if (name !== undefined && typeof name !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'variables --name requires a value', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'variables',
    file: args.file,
    result: getVariables(buildIndexes(model), { element, name })
  });
}
