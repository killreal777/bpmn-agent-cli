import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getSubprocesses } from '../../query/subprocess.js';
import type { ParsedArgs } from '../args.js';

export async function subprocessCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'subprocess requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'subprocess',
    file: args.file,
    result: getSubprocesses(buildIndexes(model), {
      id: stringOption(args.options.get('--id'))
    })
  });
}

function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
