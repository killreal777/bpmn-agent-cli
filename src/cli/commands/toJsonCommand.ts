import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { convertBpmnToJson } from '../../legacy/convert.js';
import { getPresetConfig } from '../../legacy/config.js';
import type { ParsedArgs } from '../args.js';

export async function toJsonCommand(args: ParsedArgs, pretty: boolean): Promise<void> {
  const printConfig = stringOption(args, '--print-config');
  if (printConfig) {
    process.stdout.write(`${JSON.stringify(getPresetConfig(printConfig), null, pretty ? 2 : 0)}\n`);
    return;
  }

  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'to-json requires a BPMN file', 2);
  }

  const xml = await readFile(args.file, 'utf8');
  const converted = await convertBpmnToJson(xml, { preset: stringOption(args, '--preset') as 'base' | 'optimized' | undefined });
  const output = `${JSON.stringify(converted, null, pretty ? 2 : 0)}\n`;
  const outputPath = stringOption(args, '-o') ?? stringOption(args, '--output');

  if (!outputPath) {
    process.stdout.write(output);
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
}

function stringOption(args: ParsedArgs, name: string): string | undefined {
  const value = args.options.get(name);
  return typeof value === 'string' ? value : undefined;
}
