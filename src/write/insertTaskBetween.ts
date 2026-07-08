import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, Diagnostic, ElementSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type InsertTaskType = 'task' | 'userTask' | 'serviceTask';

export type InsertTaskBetweenResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  inserted: ElementSummary;
  replacedFlow: SequenceFlowSummary;
  newFlows: SequenceFlowSummary[];
  warnings: Diagnostic[];
  diff: Array<{
    op: 'replace' | 'add';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type InsertTaskBetweenArgs = {
  xml: string;
  indexes: BpmnIndexes;
  flowId: string;
  elementId: string;
  name: string;
  type?: string;
  incomingFlowId?: string | null;
  outgoingFlowId?: string | null;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type InsertTaskBetweenPlan = {
  xml: string;
  result: InsertTaskBetweenResult;
};

export function insertTaskBetweenXml(args: InsertTaskBetweenArgs): InsertTaskBetweenPlan {
  const replacedFlow = args.indexes.sequenceFlowById.get(args.flowId);
  if (!replacedFlow) {
    throw new BpmnCliError('REFERENCE_NOT_FOUND', 'Sequence flow not found', 1, { flowId: args.flowId });
  }

  if (replacedFlow.condition) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Conditioned sequence flows are not supported by insert-task-between in P3-A', 1, { flowId: args.flowId });
  }

  const taskType = parseTaskType(args.type ?? 'task');
  const incomingFlowId = args.incomingFlowId ?? `${args.flowId}_to_${args.elementId}`;
  const outgoingFlowId = args.outgoingFlowId ?? `${args.elementId}_to_${replacedFlow.targetId}`;
  assertNewId(args.indexes, args.elementId, 'elementId');
  assertNewId(args.indexes, incomingFlowId, 'incomingFlowId');
  assertNewId(args.indexes, outgoingFlowId, 'outgoingFlowId');

  const inserted: ElementSummary = {
    id: args.elementId,
    type: taskType.canonicalType,
    name: args.name,
    processId: args.indexes.byId.get(replacedFlow.sourceId)?.processId ?? args.indexes.byId.get(replacedFlow.targetId)?.processId ?? null
  };
  const newFlows: SequenceFlowSummary[] = [
    {
      id: incomingFlowId,
      type: 'bpmn:SequenceFlow',
      name: null,
      sourceId: replacedFlow.sourceId,
      sourceName: replacedFlow.sourceName,
      targetId: args.elementId,
      targetName: args.name,
      condition: null
    },
    {
      id: outgoingFlowId,
      type: 'bpmn:SequenceFlow',
      name: null,
      sourceId: args.elementId,
      sourceName: args.name,
      targetId: replacedFlow.targetId,
      targetName: replacedFlow.targetName,
      condition: null
    }
  ];

  let xml = args.xml;
  xml = replaceNodeReference(xml, replacedFlow.sourceId, 'outgoing', args.flowId, incomingFlowId);
  xml = replaceNodeReference(xml, replacedFlow.targetId, 'incoming', args.flowId, outgoingFlowId);
  xml = replaceSequenceFlow(xml, args.flowId, taskType.xmlTag, args.elementId, args.name, newFlows);

  return {
    xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      inserted,
      replacedFlow,
      newFlows,
      warnings: [{
        severity: 'warning',
        code: 'DI_NOT_UPDATED',
        message: 'BPMNDI layout is not updated in P3-A'
      }],
      diff: [
        {
          op: 'replace',
          path: `/sequenceFlows/${args.flowId}`,
          before: `${replacedFlow.sourceId}->${replacedFlow.targetId}`,
          after: `${replacedFlow.sourceId}->${args.elementId}->${replacedFlow.targetId}`
        },
        {
          op: 'add',
          path: `/elements/${args.elementId}`,
          before: null,
          after: args.name
        },
        {
          op: 'add',
          path: `/sequenceFlows/${incomingFlowId}`,
          before: null,
          after: `${replacedFlow.sourceId}->${args.elementId}`
        },
        {
          op: 'add',
          path: `/sequenceFlows/${outgoingFlowId}`,
          before: null,
          after: `${args.elementId}->${replacedFlow.targetId}`
        }
      ]
    }
  };
}

function parseTaskType(type: string): { canonicalType: string; xmlTag: string } {
  if (type === 'task') {
    return { canonicalType: 'bpmn:Task', xmlTag: 'task' };
  }
  if (type === 'userTask') {
    return { canonicalType: 'bpmn:UserTask', xmlTag: 'userTask' };
  }
  if (type === 'serviceTask') {
    return { canonicalType: 'bpmn:ServiceTask', xmlTag: 'serviceTask' };
  }

  throw new BpmnCliError('INVALID_OPTION_VALUE', `Unsupported insert task type: ${type}`, 2, { type });
}

function assertNewId(indexes: BpmnIndexes, id: string, field: string): void {
  if (indexes.byId.has(id) || indexes.sequenceFlowById.has(id)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', `Duplicate id for ${field}`, 2, { [field]: id });
  }
}

function replaceNodeReference(xml: string, elementId: string, direction: 'incoming' | 'outgoing', oldFlowId: string, newFlowId: string): string {
  const escapedId = escapeRegExp(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml.match(openPattern);
  if (!open || open.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find flow node opening tag', 1, { elementId });
  }

  const fullOpenTag = open[0];
  const tagName = open[1];
  const closeTag = `</${tagName}>`;
  const closeIndex = xml.indexOf(closeTag, open.index + fullOpenTag.length);
  if (closeIndex === -1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find flow node closing tag', 1, { elementId });
  }

  const bodyStart = open.index + fullOpenTag.length;
  const body = xml.slice(bodyStart, closeIndex);
  const reference = `<bpmn:${direction}>${oldFlowId}</bpmn:${direction}>`;
  if (!body.includes(reference)) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', `Could not find ${direction} reference on flow node`, 1, {
      elementId,
      flowId: oldFlowId
    });
  }

  const updatedBody = body.replace(reference, `<bpmn:${direction}>${newFlowId}</bpmn:${direction}>`);
  return `${xml.slice(0, bodyStart)}${updatedBody}${xml.slice(closeIndex)}`;
}

function replaceSequenceFlow(
  xml: string,
  flowId: string,
  taskXmlTag: string,
  elementId: string,
  name: string,
  newFlows: SequenceFlowSummary[]
): string {
  const escapedId = escapeRegExp(flowId);
  const flowPattern = new RegExp(`<bpmn:sequenceFlow\\b[^>]*\\bid="${escapedId}"[^>]*>`);
  const flow = xml.match(flowPattern);
  if (!flow || flow.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find sequence flow tag', 1, { flowId });
  }
  if (!flow[0].endsWith('/>')) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Only self-closing sequence flows are supported by insert-task-between in P3-A', 1, { flowId });
  }

  const lineStart = xml.lastIndexOf('\n', flow.index) + 1;
  const indent = xml.slice(lineStart, flow.index).match(/^\s*/)?.[0] ?? '';
  const task = [
    `<bpmn:${taskXmlTag} id="${escapeAttribute(elementId)}" name="${escapeAttribute(name)}">`,
    `${indent}  <bpmn:incoming>${newFlows[0].id}</bpmn:incoming>`,
    `${indent}  <bpmn:outgoing>${newFlows[1].id}</bpmn:outgoing>`,
    `${indent}</bpmn:${taskXmlTag}>`
  ].join('\n');
  const replacement = [
    `<bpmn:sequenceFlow id="${escapeAttribute(newFlows[0].id)}" sourceRef="${escapeAttribute(newFlows[0].sourceId)}" targetRef="${escapeAttribute(newFlows[0].targetId)}" />`,
    task,
    `<bpmn:sequenceFlow id="${escapeAttribute(newFlows[1].id)}" sourceRef="${escapeAttribute(newFlows[1].sourceId)}" targetRef="${escapeAttribute(newFlows[1].targetId)}" />`
  ].join(`\n${indent}`);

  return `${xml.slice(0, flow.index)}${replacement}${xml.slice(flow.index + flow[0].length)}`;
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
