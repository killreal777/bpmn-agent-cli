import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../bpmn/moddle.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { addBoundaryEventXml } from '../../write/addBoundaryEvent.js';
import type { ParsedArgs } from '../args.js';

export async function addBoundaryEventCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'add-boundary-event requires a BPMN file', 2);
  }

  const attachedToId = requiredString(args, '--attached-to', 'add-boundary-event requires --attached-to');
  const boundaryEventId = requiredString(args, '--id', 'add-boundary-event requires --id');
  const targetId = requiredString(args, '--target', 'add-boundary-event requires --target');
  const flowId = requiredString(args, '--flow-id', 'add-boundary-event requires --flow-id');
  const duration = requiredString(args, '--duration', 'add-boundary-event requires --duration');
  const name = args.options.get('--name');
  if (name !== undefined && typeof name !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--name requires a value', 2);
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
  const plan = addBoundaryEventXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    attachedToId,
    boundaryEventId,
    targetId,
    flowId,
    duration,
    name: name ?? null,
    cancelActivity: args.options.get('--non-interrupting') === true ? false : true,
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
    command: 'add-boundary-event',
    file: args.file,
    result: plan.result
  });
}

function requiredString(args: ParsedArgs, key: string, message: string): string {
  const value = args.options.get(key);
  if (typeof value !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', message, 2);
  }
  return value;
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
    throw new BpmnCliError('OUTPUT_WRITE_ERROR', 'Failed to write boundary event BPMN', 1, {
      path,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}
