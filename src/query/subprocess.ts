import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, EventSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type SubprocessResult = {
  subprocesses: Array<{
    element: ElementSummary;
    parentSubprocessId: string | null;
    children: ElementSummary[];
    nestedSubprocesses: ElementSummary[];
    incoming: SequenceFlowSummary[];
    outgoing: SequenceFlowSummary[];
    boundaryEvents: EventSummary[];
  }>;
};

const SUBPROCESS_TYPES = new Set(['bpmn:SubProcess', 'bpmn:AdHocSubProcess', 'bpmn:Transaction']);

export function getSubprocesses(indexes: BpmnIndexes, args: { id?: string }): SubprocessResult {
  if (args.id) {
    const element = indexes.byId.get(args.id);
    if (!element) {
      throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
    }

    if (!SUBPROCESS_TYPES.has(element.type)) {
      throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Element is not a subprocess', 1, {
        elementId: args.id,
        type: element.type
      });
    }

    return { subprocesses: [summarizeSubprocess(indexes, element)] };
  }

  return {
    subprocesses: [...indexes.byId.values()]
      .filter((element) => SUBPROCESS_TYPES.has(element.type))
      .sort(sortById)
      .map((element) => summarizeSubprocess(indexes, element))
  };
}

function summarizeSubprocess(indexes: BpmnIndexes, element: ElementSummary): SubprocessResult['subprocesses'][number] {
  const children = [...(indexes.childrenBySubprocessId.get(element.id) ?? [])].sort(sortById);
  return {
    element,
    parentSubprocessId: indexes.subprocessParentByChildId.get(element.id) ?? null,
    children,
    nestedSubprocesses: children.filter((child) => SUBPROCESS_TYPES.has(child.type)).sort(sortById),
    incoming: indexes.incomingByNodeId.get(element.id) ?? [],
    outgoing: indexes.outgoingByNodeId.get(element.id) ?? [],
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(element.id) ?? []
  };
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
