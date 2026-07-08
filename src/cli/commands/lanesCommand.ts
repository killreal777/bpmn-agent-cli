import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getLanes } from '../../query/lanes.js';
import type { ParsedArgs } from '../args.js';

export async function lanesCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'lanes requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'lanes',
    file: args.file,
    result: getLanes(buildIndexes(model), {
      elementId: stringOption(args.options.get('--element'))
    })
  });
}

function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
