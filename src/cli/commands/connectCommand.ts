import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../bpmn/moddle.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { connectElementsXml } from '../../write/connectElements.js';
import type { ParsedArgs } from '../args.js';

export async function connectCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'connect requires a BPMN file', 2);
  }

  const sourceId = requiredString(args, '--from', 'connect requires --from');
  const targetId = requiredString(args, '--to', 'connect requires --to');
  const flowId = requiredString(args, '--id', 'connect requires --id');
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
  const plan = connectElementsXml({
    xml: model.xml,
    indexes: buildIndexes(model),
    sourceId,
    targetId,
    flowId,
    name: name ?? null,
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
    command: 'connect',
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
    throw new BpmnCliError('OUTPUT_WRITE_ERROR', 'Failed to write connected BPMN', 1, {
      path,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}
