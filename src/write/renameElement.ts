import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';

export type RenameResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: {
    name: string | null;
  };
  after: {
    name: string;
  };
  diff: Array<{
    op: 'replace' | 'add';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type RenameElementArgs = {
  xml: string;
  indexes: BpmnIndexes;
  elementId: string;
  name: string;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type RenamePlan = {
  xml: string;
  result: RenameResult;
};

export function renameElementXml(args: RenameElementArgs): RenamePlan {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
  }

  const patch = patchOpeningTag(args.xml, args.elementId, args.name);
  return {
    xml: patch.xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      before: { name: element.name },
      after: { name: args.name },
      diff: [{
        op: patch.operation,
        path: `/elements/${args.elementId}/name`,
        before: element.name,
        after: args.name
      }]
    }
  };
}

function patchOpeningTag(xml: string, elementId: string, name: string): { xml: string; operation: 'replace' | 'add' } {
  const escapedId = escapeRegExp(elementId);
  const tagPattern = new RegExp(`<[^!?/][^>]*\\bid="${escapedId}"[^>]*>`);
  const match = xml.match(tagPattern);
  if (!match || match.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target element opening tag', 1, { elementId });
  }

  const tag = match[0];
  const escapedName = escapeAttribute(name);
  const namePattern = /\bname="[^"]*"/;
  const operation = namePattern.test(tag) ? 'replace' : 'add';
  const updatedTag = operation === 'replace'
    ? tag.replace(namePattern, `name="${escapedName}"`)
    : tag.replace(/\/?>$/, (suffix) => ` name="${escapedName}"${suffix}`);

  return {
    xml: `${xml.slice(0, match.index)}${updatedTag}${xml.slice(match.index + tag.length)}`,
    operation
  };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
