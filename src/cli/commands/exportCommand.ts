import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { renderMarkdown } from '../../export/renderMarkdown.js';
import { renderText } from '../../export/renderText.js';
import { successEnvelope, writeJson } from '../../output/jsonOutput.js';
import { buildExportModel, EXPORT_SECTIONS, type ExportSection } from '../../query/exportModel.js';
import type { ParsedArgs } from '../args.js';

type ExportFormat = 'markdown' | 'text' | 'json';

const FORMATS = new Set<ExportFormat>(['markdown', 'text', 'json']);

export async function exportCommand(args: ParsedArgs, pretty: boolean): Promise<void> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'export requires a BPMN file', 2);
  }

  const format = parseFormat(args.options.get('--format'));
  const sections = parseSections(args.options.get('--section'));
  const outputPath = args.options.get('-o');
  if (outputPath !== undefined && typeof outputPath !== 'string') {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '-o requires an output path', 2);
  }

  const model = await loadBpmn(args.file);
  const exportModel = buildExportModel(model, sections);
  const payload = format === 'json'
    ? JSON.stringify(successEnvelope({ command: 'export', file: args.file, result: exportModel }), null, pretty ? 2 : 0)
    : render(format, exportModel);

  if (outputPath) {
    await writeOutput(outputPath, payload);
    return;
  }

  if (format === 'json') {
    writeJson(successEnvelope({ command: 'export', file: args.file, result: exportModel }), pretty);
    return;
  }

  process.stdout.write(payload);
}

function parseFormat(value: string | boolean | undefined): ExportFormat {
  if (value === undefined) {
    return 'markdown';
  }
  if (typeof value !== 'string' || !FORMATS.has(value as ExportFormat)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--format must be markdown, text, or json', 2, { option: '--format', value });
  }
  return value as ExportFormat;
}

function parseSections(value: string | boolean | undefined): ExportSection[] {
  if (value === undefined || value === 'all') {
    return [...EXPORT_SECTIONS];
  }
  if (typeof value !== 'string' || !EXPORT_SECTIONS.includes(value as ExportSection)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', '--section must be all or a supported export section', 2, { option: '--section', value });
  }
  return [value as ExportSection];
}

function render(format: Exclude<ExportFormat, 'json'>, model: ReturnType<typeof buildExportModel>): string {
  return format === 'markdown' ? renderMarkdown(model) : renderText(model);
}

async function writeOutput(path: string, payload: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, payload, 'utf8');
  } catch (error: unknown) {
    throw new BpmnCliError('OUTPUT_WRITE_ERROR', 'Failed to write export output', 1, { path, cause: error instanceof Error ? error.message : String(error) });
  }
}
