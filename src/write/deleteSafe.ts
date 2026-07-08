import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, Diagnostic, ElementSummary, SequenceFlowSummary } from '../bpmn/types.js';

const UNSAFE_DELETE_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:BoundaryEvent',
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:InclusiveGateway',
  'bpmn:EventBasedGateway',
  'bpmn:SubProcess',
  'bpmn:AdHocSubProcess',
  'bpmn:Transaction',
  'bpmn:CallActivity',
  'bpmn:SequenceFlow'
]);

export type DeleteSafeResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  deleted: ElementSummary;
  removedFlows: SequenceFlowSummary[];
  replacementFlow: SequenceFlowSummary;
  warnings: Diagnostic[];
  diff: Array<{
    op: 'remove' | 'add' | 'replace';
    path: string;
    before: string | null;
    after: string | null;
  }>;
};

export type DeleteSafeArgs = {
  xml: string;
  indexes: BpmnIndexes;
  elementId: string;
  replacementFlowId?: string | null;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type DeleteSafePlan = {
  xml: string;
  result: DeleteSafeResult;
};

export function deleteSafeXml(args: DeleteSafeArgs): DeleteSafePlan {
  const deleted = args.indexes.byId.get(args.elementId);
  if (!deleted) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
  }
  if (UNSAFE_DELETE_TYPES.has(deleted.type)) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Element type is not safe to delete in P3-C', 1, {
      elementId: args.elementId,
      type: deleted.type
    });
  }

  const incoming = args.indexes.incomingByNodeId.get(args.elementId) ?? [];
  const outgoing = args.indexes.outgoingByNodeId.get(args.elementId) ?? [];
  if (incoming.length !== 1 || outgoing.length !== 1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'delete-safe requires exactly one incoming and one outgoing sequence flow', 1, {
      elementId: args.elementId,
      incoming: incoming.length,
      outgoing: outgoing.length
    });
  }

  const incomingFlow = incoming[0];
  const outgoingFlow = outgoing[0];
  const replacementFlowId = args.replacementFlowId ?? `${incomingFlow.id}_to_${outgoingFlow.targetId}`;
  if (args.indexes.byId.has(replacementFlowId) || args.indexes.sequenceFlowById.has(replacementFlowId)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'Duplicate replacement flow id', 2, { replacementFlowId });
  }

  const replacementFlow: SequenceFlowSummary = {
    id: replacementFlowId,
    type: 'bpmn:SequenceFlow',
    name: null,
    sourceId: incomingFlow.sourceId,
    sourceName: incomingFlow.sourceName,
    targetId: outgoingFlow.targetId,
    targetName: outgoingFlow.targetName,
    condition: null
  };

  let xml = args.xml;
  xml = replaceNodeReference(xml, incomingFlow.sourceId, 'outgoing', incomingFlow.id, replacementFlow.id);
  xml = replaceNodeReference(xml, outgoingFlow.targetId, 'incoming', outgoingFlow.id, replacementFlow.id);
  xml = replaceSequenceFlowWithReplacement(xml, incomingFlow.id, replacementFlow);
  xml = removeElementSection(xml, outgoingFlow.id);
  xml = removeElementSection(xml, deleted.id);
  xml = removeBpmndiByBpmnElement(xml, [deleted.id, incomingFlow.id, outgoingFlow.id]);

  return {
    xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      deleted,
      removedFlows: [incomingFlow, outgoingFlow],
      replacementFlow,
      warnings: [{
        severity: 'warning',
        code: 'DI_NOT_UPDATED',
        message: 'BPMNDI layout is not updated in P3-C'
      }],
      diff: [
        {
          op: 'remove',
          path: `/elements/${deleted.id}`,
          before: deleted.name ?? deleted.id,
          after: null
        },
        {
          op: 'remove',
          path: `/sequenceFlows/${incomingFlow.id}`,
          before: `${incomingFlow.sourceId}->${incomingFlow.targetId}`,
          after: null
        },
        {
          op: 'remove',
          path: `/sequenceFlows/${outgoingFlow.id}`,
          before: `${outgoingFlow.sourceId}->${outgoingFlow.targetId}`,
          after: null
        },
        {
          op: 'add',
          path: `/sequenceFlows/${replacementFlow.id}`,
          before: null,
          after: `${replacementFlow.sourceId}->${replacementFlow.targetId}`
        },
        {
          op: 'replace',
          path: `/elements/${replacementFlow.sourceId}/outgoing`,
          before: incomingFlow.id,
          after: replacementFlow.id
        },
        {
          op: 'replace',
          path: `/elements/${replacementFlow.targetId}/incoming`,
          before: outgoingFlow.id,
          after: replacementFlow.id
        }
      ]
    }
  };
}

function replaceNodeReference(xml: string, elementId: string, direction: 'incoming' | 'outgoing', oldFlowId: string, newFlowId: string): string {
  const section = findElementSection(xml, elementId);
  const body = xml.slice(section.bodyStart, section.closeIndex);
  const oldReference = `<bpmn:${direction}>${oldFlowId}</bpmn:${direction}>`;
  if (!body.includes(oldReference)) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', `Could not find ${direction} reference on flow node`, 1, {
      elementId,
      flowId: oldFlowId
    });
  }

  const updatedBody = body.replace(oldReference, `<bpmn:${direction}>${newFlowId}</bpmn:${direction}>`);
  return `${xml.slice(0, section.bodyStart)}${updatedBody}${xml.slice(section.closeIndex)}`;
}

function replaceSequenceFlowWithReplacement(xml: string, flowId: string, replacementFlow: SequenceFlowSummary): string {
  const section = findElementSection(xml, flowId);
  const lineStart = xml.lastIndexOf('\n', section.openIndex) + 1;
  const indent = xml.slice(lineStart, section.openIndex).match(/^\s*/)?.[0] ?? '';
  const replacement = `${indent}<bpmn:sequenceFlow id="${escapeAttribute(replacementFlow.id)}" sourceRef="${escapeAttribute(replacementFlow.sourceId)}" targetRef="${escapeAttribute(replacementFlow.targetId)}" />`;
  return `${xml.slice(0, lineStart)}${replacement}${xml.slice(section.endIndex)}`;
}

function removeElementSection(xml: string, elementId: string): string {
  const section = findElementSection(xml, elementId);
  const lineStart = xml.lastIndexOf('\n', section.openIndex) + 1;
  const lineEnd = xml[section.endIndex] === '\n' ? section.endIndex + 1 : section.endIndex;
  return `${xml.slice(0, lineStart)}${xml.slice(lineEnd)}`;
}

function removeBpmndiByBpmnElement(xml: string, ids: string[]): string {
  let next = xml;
  for (const id of ids) {
    next = removeSelfClosingTagsByAttribute(next, 'bpmndi:BPMNShape', 'bpmnElement', id);
    next = removeSelfClosingTagsByAttribute(next, 'bpmndi:BPMNEdge', 'bpmnElement', id);
    next = removePairedTagsByAttribute(next, 'bpmndi:BPMNShape', 'bpmnElement', id);
    next = removePairedTagsByAttribute(next, 'bpmndi:BPMNEdge', 'bpmnElement', id);
  }
  return next;
}

function removeSelfClosingTagsByAttribute(xml: string, tagName: string, attribute: string, value: string): string {
  const pattern = new RegExp(`^[ \\t]*<${escapeRegExp(tagName)}\\b[^>]*\\b${escapeRegExp(attribute)}="${escapeRegExp(value)}"[^>]*/>\\n?`, 'gm');
  return xml.replace(pattern, '');
}

function removePairedTagsByAttribute(xml: string, tagName: string, attribute: string, value: string): string {
  const pattern = new RegExp(`^[ \\t]*<${escapeRegExp(tagName)}\\b[^>]*\\b${escapeRegExp(attribute)}="${escapeRegExp(value)}"[^>]*>[\\s\\S]*?</${escapeRegExp(tagName)}>\\n?`, 'gm');
  return xml.replace(pattern, '');
}

function findElementSection(xml: string, elementId: string): {
  openIndex: number;
  bodyStart: number;
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
    return {
      openIndex: open.index,
      bodyStart: open.index + open[0].length,
      closeIndex: open.index + open[0].length,
      endIndex: open.index + open[0].length
    };
  }

  const closeTag = `</${open[1]}>`;
  const closeIndex = xml.indexOf(closeTag, open.index + open[0].length);
  if (closeIndex === -1) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target XML closing tag', 1, { elementId });
  }

  return {
    openIndex: open.index,
    bodyStart: open.index + open[0].length,
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
