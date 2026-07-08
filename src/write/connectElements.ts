import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, Diagnostic, ElementSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type ConnectResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  flow: SequenceFlowSummary;
  source: ElementSummary;
  target: ElementSummary;
  warnings: Diagnostic[];
  diff: Array<{
    op: 'add';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type ConnectElementsArgs = {
  xml: string;
  indexes: BpmnIndexes;
  sourceId: string;
  targetId: string;
  flowId: string;
  name?: string | null;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type ConnectPlan = {
  xml: string;
  result: ConnectResult;
};

export function connectElementsXml(args: ConnectElementsArgs): ConnectPlan {
  const source = requireElement(args.indexes, args.sourceId, 'sourceId');
  const target = requireElement(args.indexes, args.targetId, 'targetId');
  if (source.type === 'bpmn:SequenceFlow' || target.type === 'bpmn:SequenceFlow') {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'connect endpoints must be flow nodes, not sequence flows', 1, {
      sourceId: args.sourceId,
      targetId: args.targetId
    });
  }
  if (args.indexes.byId.has(args.flowId) || args.indexes.sequenceFlowById.has(args.flowId)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'Duplicate sequence flow id', 2, { flowId: args.flowId });
  }

  const flow: SequenceFlowSummary = {
    id: args.flowId,
    type: 'bpmn:SequenceFlow',
    name: args.name ?? null,
    sourceId: source.id,
    sourceName: source.name,
    targetId: target.id,
    targetName: target.name,
    condition: null
  };

  let xml = args.xml;
  xml = appendFlowReference(xml, source.id, 'outgoing', flow.id);
  xml = appendFlowReference(xml, target.id, 'incoming', flow.id);
  xml = insertSequenceFlowAfterElement(xml, source.id, flow);

  return {
    xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      flow,
      source,
      target,
      warnings: [{
        severity: 'warning',
        code: 'DI_NOT_UPDATED',
        message: 'BPMNDI layout is not updated in P3-B'
      }],
      diff: [
        {
          op: 'add',
          path: `/sequenceFlows/${flow.id}`,
          before: null,
          after: `${source.id}->${target.id}`
        },
        {
          op: 'add',
          path: `/elements/${source.id}/outgoing`,
          before: null,
          after: flow.id
        },
        {
          op: 'add',
          path: `/elements/${target.id}/incoming`,
          before: null,
          after: flow.id
        }
      ]
    }
  };
}

function requireElement(indexes: BpmnIndexes, id: string, field: string): ElementSummary {
  const element = indexes.byId.get(id);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { [field]: id });
  }
  return element;
}

function appendFlowReference(xml: string, elementId: string, direction: 'incoming' | 'outgoing', flowId: string): string {
  const section = findElementSection(xml, elementId);
  const lineStart = xml.lastIndexOf('\n', section.closeIndex) + 1;
  const indent = xml.slice(lineStart, section.closeIndex).match(/^\s*/)?.[0] ?? '';
  const insertion = `${indent}  <bpmn:${direction}>${escapeText(flowId)}</bpmn:${direction}>\n`;
  return `${xml.slice(0, section.closeIndex)}${insertion}${xml.slice(section.closeIndex)}`;
}

function insertSequenceFlowAfterElement(xml: string, sourceId: string, flow: SequenceFlowSummary): string {
  const section = findElementSection(xml, sourceId);
  const afterClose = section.closeIndex + section.closeTag.length;
  const lineStart = xml.lastIndexOf('\n', section.openIndex) + 1;
  const indent = xml.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? '';
  const name = flow.name ? ` name="${escapeAttribute(flow.name)}"` : '';
  const flowXml = `\n${indent}<bpmn:sequenceFlow id="${escapeAttribute(flow.id)}"${name} sourceRef="${escapeAttribute(flow.sourceId)}" targetRef="${escapeAttribute(flow.targetId)}" />`;
  return `${xml.slice(0, afterClose)}${flowXml}${xml.slice(afterClose)}`;
}

function findElementSection(xml: string, elementId: string): { openIndex: number; closeIndex: number; closeTag: string } {
  const escapedId = escapeRegExp(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml.match(openPattern);
  if (!open || open.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find flow node opening tag', 1, { elementId });
  }
  if (open[0].endsWith('/>')) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Self-closing flow nodes are not supported by connect in P3-B', 1, { elementId });
  }

  const closeTag = `</${open[1]}>`;
  const closeIndex = xml.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find flow node closing tag', 1, { elementId });
  }

  return { openIndex: open.index, closeIndex, closeTag };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
