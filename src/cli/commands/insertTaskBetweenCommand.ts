import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../bpmn/moddle.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { insertTaskBetweenXml } from '../../write/insertTaskBetween.js';
import type { ParsedArgs } from '../args.js';

export async function insertTaskBetweenCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'insert-task-between requires a BPMN file', 2);
  }

  const flowId = requiredString(args, '--flow', 'insert-task-between requires --flow');
  const elementId = requiredString(args, '--id', 'insert-task-between requires --id');
  const name = requiredString(args, '--name', 'insert-task-between requires --name');
  const type = args.options.get('--type');
  const incomingFlowId = args.options.get('--incoming-flow-id');
  const outgoingFlowId = args.options.get('--outgoing-flow-id');

  if (type !== undefined && typeof type !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--type requires a value', 2);
  }
  if (incomingFlowId !== undefined && typeof incomingFlowId !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--incoming-flow-id requires a value', 2);
  }
  if (outgoingFlowId !== undefined && typeof outgoingFlowId !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--outgoing-flow-id requires a value', 2);
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
  const plan = insertTaskBetweenXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    flowId,
    elementId,
    name,
    type: type ?? 'task',
    incomingFlowId: incomingFlowId ?? null,
    outgoingFlowId: outgoingFlowId ?? null,
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
    command: 'insert-task-between',
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
    throw new BpmnCliError('OUTPUT_WRITE_ERROR', 'Failed to write inserted BPMN', 1, {
      path,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}
