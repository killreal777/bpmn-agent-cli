import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, EventSummary, ImplementationSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type ElementResult = {
  element: ElementSummary & {
    incoming?: SequenceFlowSummary[];
    outgoing?: SequenceFlowSummary[];
    source?: ElementSummary | null;
    target?: ElementSummary | null;
    condition?: string | null;
    implementations?: ImplementationSummary[];
    boundaryEvents?: EventSummary[];
    laneIds?: string[];
    participantId?: string | null;
  };
};

export function getElement(indexes: BpmnIndexes, args: { id: string }): ElementResult {
  const element = indexes.byId.get(args.id);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id }, suggestions(indexes, args.id));
  }

  const sequenceFlow = indexes.sequenceFlowById.get(args.id);
  if (sequenceFlow) {
    return {
      element: {
        ...element,
        source: indexes.byId.get(sequenceFlow.sourceId) ?? null,
        target: indexes.byId.get(sequenceFlow.targetId) ?? null,
        condition: sequenceFlow.condition
      }
    };
  }

  return {
    element: {
      ...element,
      incoming: indexes.incomingByNodeId.get(element.id) ?? [],
      outgoing: indexes.outgoingByNodeId.get(element.id) ?? [],
      implementations: indexes.implementationsByElementId.get(element.id) ?? [],
      boundaryEvents: indexes.boundaryEventsByAttachedToId.get(element.id) ?? [],
      laneIds: (indexes.lanesByElementId.get(element.id) ?? []).map((lane) => lane.id),
      participantId: element.processId ? indexes.participantByProcessId.get(element.processId)?.id ?? null : null
    }
  };
}

function suggestions(indexes: BpmnIndexes, query: string): Array<ElementSummary & { score: number }> {
  const normalized = query.toLocaleLowerCase();
  return [...indexes.byId.values()]
    .map((element) => ({
      ...element,
      score: element.id.toLocaleLowerCase().includes(normalized)
        ? 0.7
        : (element.name ?? '').toLocaleLowerCase().includes(normalized) ? 0.5 : 0
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 5);
}
