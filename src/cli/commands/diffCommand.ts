import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { diffModels } from '../../query/diff.js';
import type { ParsedArgs } from '../args.js';

export async function diffCommand(args: ParsedArgs): Promise<unknown> {
  const base = args.options.get('--base');
  const candidate = args.options.get('--candidate');

  if (typeof base !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'diff requires --base <file>', 2);
  }

  if (typeof candidate !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'diff requires --candidate <file>', 2);
  }

  const baseModel = await loadBpmn(base);
  const candidateModel = await loadBpmn(candidate);

  return successEnvelope({
    command: 'diff',
    file: null,
    result: diffModels({
      baseFile: baseModel.filePath,
      candidateFile: candidateModel.filePath,
      base: buildIndexes(baseModel),
      candidate: buildIndexes(candidateModel)
    })
  });
}
