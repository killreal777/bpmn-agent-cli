import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';

export type DocumentationResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: {
    documentation: string | null;
  };
  after: {
    documentation: string;
  };
  diff: Array<{
    op: 'replace' | 'add';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type DocumentElementArgs = {
  xml: string;
  indexes: BpmnIndexes;
  elementId: string;
  text: string;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type DocumentationPlan = {
  xml: string;
  result: DocumentationResult;
};

export function documentElementXml(args: DocumentElementArgs): DocumentationPlan {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
  }

  const patch = patchDocumentation(args.xml, args.elementId, args.text);
  return {
    xml: patch.xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      before: { documentation: patch.before },
      after: { documentation: args.text },
      diff: [{
        op: patch.operation,
        path: `/elements/${args.elementId}/documentation`,
        before: patch.before,
        after: args.text
      }]
    }
  };
}

function patchDocumentation(xml: string, elementId: string, text: string): { xml: string; operation: 'replace' | 'add'; before: string | null } {
  const escapedId = escapeRegExp(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml.match(openPattern);
  if (!open || open.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target element opening tag', 1, { elementId });
  }

  const fullOpenTag = open[0];
  const tagName = open[1];
  const start = open.index;
  const escapedText = escapeText(text);

  if (fullOpenTag.endsWith('/>')) {
    const replacement = `${fullOpenTag.slice(0, -2)}><bpmn:documentation>${escapedText}</bpmn:documentation></${tagName}>`;
    return {
      xml: `${xml.slice(0, start)}${replacement}${xml.slice(start + fullOpenTag.length)}`,
      operation: 'add',
      before: null
    };
  }

  const closeTag = `</${tagName}>`;
  const closeIndex = xml.indexOf(closeTag, start + fullOpenTag.length);
  if (closeIndex === -1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target element closing tag', 1, { elementId });
  }

  const bodyStart = start + fullOpenTag.length;
  const body = xml.slice(bodyStart, closeIndex);
  const docPattern = /<bpmn:documentation\b[^>]*>([\s\S]*?)<\/bpmn:documentation>/;
  const doc = body.match(docPattern);
  if (doc && doc.index !== undefined) {
    const before = unescapeText(doc[1]);
    const replacement = `<bpmn:documentation>${escapedText}</bpmn:documentation>`;
    const absoluteDocStart = bodyStart + doc.index;
    return {
      xml: `${xml.slice(0, absoluteDocStart)}${replacement}${xml.slice(absoluteDocStart + doc[0].length)}`,
      operation: 'replace',
      before
    };
  }

  const insertion = `<bpmn:documentation>${escapedText}</bpmn:documentation>`;
  return {
    xml: `${xml.slice(0, bodyStart)}${insertion}${xml.slice(bodyStart)}`,
    operation: 'add',
    before: null
  };
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeText(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
