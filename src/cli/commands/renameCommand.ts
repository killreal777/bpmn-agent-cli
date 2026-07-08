import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../bpmn/moddle.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { renameElementXml } from '../../write/renameElement.js';
import type { ParsedArgs } from '../args.js';

export async function renameCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'rename requires a BPMN file', 2);
  }

  const elementId = args.options.get('--id');
  if (typeof elementId !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'rename requires --id', 2);
  }

  const name = args.options.get('--name');
  if (typeof name !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'rename requires --name', 2);
  }

  const write = args.options.get('--write') === true;
  const outputPath = args.options.get('-o');
  if (outputPath !== undefined && typeof outputPath !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '-o requires an output path', 2);
  }
  if (!write && outputPath) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '-o is only allowed with --write', 2);
  }

  const model = await loadBpmn(args.file);
  const targetPath = outputPath || args.file;
  const plan = renameElementXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    elementId,
    name,
    file: args.file,
    outputFile: write ? targetPath : null,
    dryRun: !write,
    written: write
  });

  await validateXml(plan.xml);

  if (write) {
    await writeOutput(targetPath, plan.xml);
  }

  return successEnvelope({
    command: 'rename',
    file: args.file,
    result: plan.result
  });
}

async function validateXml(xml: string): Promise<void> {
  try {
    await createBpmnModdle().fromXML(xml);
  } catch (error: unknown) {
    throw new BpmnCliError('BPMN_PARSE_ERROR', 'Patched BPMN XML did not parse', 4, {
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

async function writeOutput(path: string, payload: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, payload, 'utf8');
  } catch (error: unknown) {
    throw new BpmnCliError('OUTPUT_WRITE_ERROR', 'Failed to write renamed BPMN', 1, {
      path,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}
