import { readFile } from 'node:fs/promises';
import { BpmnCliError } from './errors.js';
import { createBpmnModdle } from './moddle.js';
import type { LoadedBpmnModel, ModdleElement } from './types.js';

export async function loadBpmn(filePath: string): Promise<LoadedBpmnModel> {
  let xml: string;

  try {
    xml = await readFile(filePath, 'utf8');
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    throw new BpmnCliError(
      nodeError.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'FILE_READ_ERROR',
      nodeError.code === 'ENOENT' ? 'File not found' : 'Cannot read file',
      3,
      { filePath }
    );
  }

  try {
    const moddle = createBpmnModdle();
    const { rootElement, warnings } = await moddle.fromXML(xml);
    const definitions = rootElement as ModdleElement;
    const rootElements = arrayOf<ModdleElement>(definitions.rootElements);

    return {
      filePath,
      xml,
      definitions,
      rootElements,
      processes: rootElements.filter((element) => element.$type === 'bpmn:Process'),
      collaborations: rootElements.filter((element) => element.$type === 'bpmn:Collaboration'),
      warnings: warnings.map((warning) => ({ message: warning.message ?? 'BPMN parser warning' }))
    };
  } catch (error: unknown) {
    throw new BpmnCliError('BPMN_PARSE_ERROR', 'BPMN/XML parse error', 4, {
      filePath,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
