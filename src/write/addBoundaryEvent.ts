import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, Diagnostic, ElementSummary, EventSummary, SequenceFlowSummary } from '../bpmn/types.js';

const ACTIVITY_TYPES = new Set([
  'bpmn:Task',
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ManualTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:SubProcess',
  'bpmn:AdHocSubProcess',
  'bpmn:Transaction',
  'bpmn:CallActivity'
]);

const XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance';

export type AddBoundaryEventResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  boundaryEvent: EventSummary;
  attachedTo: ElementSummary;
  target: ElementSummary;
  flow: SequenceFlowSummary;
  timer: {
    duration: string;
    cancelActivity: boolean;
  };
  warnings: Diagnostic[];
  diff: Array<{
    op: 'add' | 'replace';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type AddBoundaryEventArgs = {
  xml: string;
  indexes: BpmnIndexes;
  attachedToId: string;
  boundaryEventId: string;
  targetId: string;
  flowId: string;
  duration: string;
  name?: string | null;
  cancelActivity?: boolean;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type AddBoundaryEventPlan = {
  xml: string;
  result: AddBoundaryEventResult;
};

export function addBoundaryEventXml(args: AddBoundaryEventArgs): AddBoundaryEventPlan {
  const attachedTo = requireElement(args.indexes, args.attachedToId, 'attachedToId');
  const target = requireElement(args.indexes, args.targetId, 'targetId');
  if (!ACTIVITY_TYPES.has(attachedTo.type)) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Boundary events can only be attached to activity-like elements in P3-D', 1, {
      attachedToId: args.attachedToId,
      type: attachedTo.type
    });
  }
  if (target.type === 'bpmn:SequenceFlow') {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Boundary event target must be a flow node', 1, { targetId: args.targetId });
  }
  assertNewId(args.indexes, args.boundaryEventId, 'boundaryEventId');
  assertNewId(args.indexes, args.flowId, 'flowId');

  const cancelActivity = args.cancelActivity ?? true;
  const boundaryEvent: EventSummary = {
    id: args.boundaryEventId,
    type: 'bpmn:BoundaryEvent',
    name: args.name ?? null,
    processId: attachedTo.processId,
    eventDefinitionType: 'bpmn:TimerEventDefinition'
  };
  const flow: SequenceFlowSummary = {
    id: args.flowId,
    type: 'bpmn:SequenceFlow',
    name: null,
    sourceId: args.boundaryEventId,
    sourceName: args.name ?? null,
    targetId: target.id,
    targetName: target.name,
    condition: null
  };

  let xml = args.xml;
  xml = ensureXsiNamespace(xml);
  xml = appendIncoming(xml, target.id, args.flowId);
  xml = insertBoundaryAfterAttached(xml, attachedTo.id, boundaryEvent, flow, args.duration, cancelActivity);

  return {
    xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      boundaryEvent,
      attachedTo,
      target,
      flow,
      timer: {
        duration: args.duration,
        cancelActivity
      },
      warnings: [{
        severity: 'warning',
        code: 'DI_NOT_UPDATED',
        message: 'BPMNDI layout is not updated in P3-D'
      }],
      diff: [
        {
          op: 'add',
          path: `/boundaryEvents/${args.boundaryEventId}`,
          before: null,
          after: attachedTo.id
        },
        {
          op: 'add',
          path: `/sequenceFlows/${args.flowId}`,
          before: null,
          after: `${args.boundaryEventId}->${target.id}`
        },
        {
          op: 'add',
          path: `/elements/${target.id}/incoming`,
          before: null,
          after: args.flowId
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

function assertNewId(indexes: BpmnIndexes, id: string, field: string): void {
  if (indexes.byId.has(id) || indexes.sequenceFlowById.has(id)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', `Duplicate id for ${field}`, 2, { [field]: id });
  }
}

function ensureXsiNamespace(xml: string): string {
  if (xml.includes('xmlns:xsi=')) {
    return xml;
  }

  const definitionsPattern = /<bpmn:definitions\b[^>]*>/;
  const match = xml.match(definitionsPattern);
  if (!match || match.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find bpmn:definitions opening tag', 1);
  }

  const tag = match[0].replace(/>$/, ` xmlns:xsi="${XSI_NS}">`);
  return `${xml.slice(0, match.index)}${tag}${xml.slice(match.index + match[0].length)}`;
}

function appendIncoming(xml: string, targetId: string, flowId: string): string {
  const section = findElementSection(xml, targetId);
  const lineStart = xml.lastIndexOf('\n', section.closeIndex) + 1;
  const indent = xml.slice(lineStart, section.closeIndex).match(/^\s*/)?.[0] ?? '';
  const insertion = `${indent}  <bpmn:incoming>${escapeText(flowId)}</bpmn:incoming>\n`;
  return `${xml.slice(0, section.closeIndex)}${insertion}${xml.slice(section.closeIndex)}`;
}

function insertBoundaryAfterAttached(
  xml: string,
  attachedToId: string,
  boundaryEvent: EventSummary,
  flow: SequenceFlowSummary,
  duration: string,
  cancelActivity: boolean
): string {
  const section = findElementSection(xml, attachedToId);
  const afterClose = section.endIndex;
  const lineStart = xml.lastIndexOf('\n', section.openIndex) + 1;
  const indent = xml.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? '';
  const name = boundaryEvent.name ? ` name="${escapeAttribute(boundaryEvent.name)}"` : '';
  const cancel = cancelActivity ? '' : ' cancelActivity="false"';
  const boundaryXml = [
    `<bpmn:boundaryEvent id="${escapeAttribute(boundaryEvent.id)}"${name} attachedToRef="${escapeAttribute(attachedToId)}"${cancel}>`,
    `${indent}  <bpmn:outgoing>${escapeText(flow.id)}</bpmn:outgoing>`,
    `${indent}  <bpmn:timerEventDefinition>`,
    `${indent}    <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">${escapeText(duration)}</bpmn:timeDuration>`,
    `${indent}  </bpmn:timerEventDefinition>`,
    `${indent}</bpmn:boundaryEvent>`,
    `${indent}<bpmn:sequenceFlow id="${escapeAttribute(flow.id)}" sourceRef="${escapeAttribute(flow.sourceId)}" targetRef="${escapeAttribute(flow.targetId)}" />`
  ].join(`\n${indent}`);

  return `${xml.slice(0, afterClose)}\n${indent}${boundaryXml}${xml.slice(afterClose)}`;
}

function findElementSection(xml: string, elementId: string): {
  openIndex: number;
  closeIndex: number;
  endIndex: number;
} {
  const escapedId = escapeRegExp(elementId);
  const openPattern = new RegExp(`<([^!?/\\s>]+)([^>]*\\bid="${escapedId}"[^>]*)>`);
  const open = xml.match(openPattern);
  if (!open || open.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target XML element', 1, { elementId });
  }
  if (open[0].endsWith('/>')) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Self-closing target elements are not supported in P3-D', 1, { elementId });
  }

  const closeTag = `</${open[1]}>`;
  const closeIndex = xml.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target XML closing tag', 1, { elementId });
  }

  return {
    openIndex: open.index,
    closeIndex,
    endIndex: closeIndex + closeTag.length
  };
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
