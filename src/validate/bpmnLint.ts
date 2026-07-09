import { normalizeName, stringValue } from '../bpmn/normalize.js';
import type { BpmnIndexes, Diagnostic, ElementSummary } from '../bpmn/types.js';

const CONDITIONAL_GATEWAYS = new Set(['bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway']);

export function bpmnLintDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  return [
    ...serviceTaskDiagnostics(indexes),
    ...gatewayDiagnostics(indexes),
    ...flowNodeDiagnostics(indexes),
    ...duplicateNameDiagnostics(indexes),
    ...boundaryEventDiagnostics(indexes),
    ...callActivityDiagnostics(indexes)
  ].sort(compareDiagnostic);
}

function serviceTaskDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const element of sortedElements(indexes.byType.get('bpmn:ServiceTask') ?? [])) {
    const raw = indexes.rawById.get(element.id);
    const implementations = indexes.implementationsByElementId.get(element.id) ?? [];

    if (!hasServiceTaskImplementation(implementations)) {
      diagnostics.push(warning(
        'SERVICE_TASK_MISSING_IMPLEMENTATION',
        'Service task has no detected implementation',
        element.id
      ));
    }

    if (raw?.type === 'external' && !stringValue(raw.topic)) {
      diagnostics.push(warning(
        'EXTERNAL_TASK_MISSING_TOPIC',
        'External service task has no topic',
        element.id
      ));
    }
  }

  return diagnostics;
}

function hasServiceTaskImplementation(implementations: Array<{ kind: string; topic?: string }>): boolean {
  return implementations.some((implementation) => {
    if (implementation.kind === 'form') {
      return false;
    }

    if (implementation.kind === 'externalTask') {
      return Boolean(implementation.topic);
    }

    return ['delegateExpression', 'class', 'expression', 'listener'].includes(implementation.kind);
  });
}

function gatewayDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const gateways = [...CONDITIONAL_GATEWAYS]
    .flatMap((type) => indexes.byType.get(type) ?? [])
    .sort(compareElement);

  for (const gateway of gateways) {
    const outgoing = indexes.outgoingByNodeId.get(gateway.id) ?? [];
    for (const flow of outgoing) {
      if (!flow.condition) {
        diagnostics.push(warning(
          'GATEWAY_OUTGOING_WITHOUT_CONDITION',
          'Conditional gateway has an outgoing sequence flow without a condition',
          gateway.id,
          { flowId: flow.id, targetId: flow.targetId }
        ));
      }
    }
  }

  return diagnostics;
}

function flowNodeDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const element of sortedElements([...indexes.byId.values()].filter((item) => isFlowNode(item)))) {
    if (element.type !== 'bpmn:EndEvent' && element.type !== 'bpmn:BoundaryEvent') {
      const outgoing = indexes.outgoingByNodeId.get(element.id)?.length ?? 0;
      if (outgoing === 0) {
        diagnostics.push(warning(
          'DEAD_END_FLOW_NODE',
          'Flow node has no outgoing sequence flow',
          element.id
        ));
      }
    }
  }

  for (const element of unreachableElements(indexes)) {
    diagnostics.push(warning(
      'UNREACHABLE_FLOW_NODE',
      'Flow node is not reachable from a process start event',
      element.id,
      { processId: element.processId ?? null }
    ));
  }

  return diagnostics;
}

function unreachableElements(indexes: BpmnIndexes): ElementSummary[] {
  const unreachable: ElementSummary[] = [];

  for (const [processId, elements] of indexes.byProcessId.entries()) {
    const nodes = sortedElements(elements.filter((element) => isFlowNode(element)));
    const starts = nodes.filter((element) => element.type === 'bpmn:StartEvent');
    if (starts.length === 0) {
      continue;
    }

    const reachable = reachableNodeIds(indexes, starts);
    for (const node of nodes) {
      if (node.type !== 'bpmn:StartEvent' && !reachable.has(node.id)) {
        unreachable.push({ ...node, processId });
      }
    }
  }

  return sortedElements(unreachable);
}

function reachableNodeIds(indexes: BpmnIndexes, starts: ElementSummary[]): Set<string> {
  const reachable = new Set<string>();
  const stack = starts.map((start) => start.id);

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || reachable.has(current)) {
      continue;
    }

    reachable.add(current);

    for (const boundaryEvent of indexes.boundaryEventsByAttachedToId.get(current) ?? []) {
      if (!reachable.has(boundaryEvent.id)) {
        stack.push(boundaryEvent.id);
      }
    }

    for (const flow of indexes.outgoingByNodeId.get(current) ?? []) {
      if (!reachable.has(flow.targetId)) {
        stack.push(flow.targetId);
      }
    }
  }

  return reachable;
}

function duplicateNameDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const [, elements] of indexes.byProcessId.entries()) {
    const byName = new Map<string, ElementSummary[]>();
    for (const element of elements.filter((item) => item.type !== 'bpmn:SequenceFlow')) {
      const normalized = normalizeName(element.name);
      if (!normalized) {
        continue;
      }
      byName.set(normalized, [...(byName.get(normalized) ?? []), element]);
    }

    for (const duplicates of byName.values()) {
      if (duplicates.length < 2) {
        continue;
      }

      const duplicateElementIds = sortedElements(duplicates).map((element) => element.id);
      for (const element of sortedElements(duplicates)) {
        diagnostics.push(warning(
          'DUPLICATE_NAME_IN_PROCESS',
          'Multiple elements in the same process share the same name',
          element.id,
          { name: element.name, duplicateElementIds }
        ));
      }
    }
  }

  return diagnostics;
}

function boundaryEventDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  return sortedElements(indexes.byType.get('bpmn:BoundaryEvent') ?? [])
    .filter((event) => (indexes.outgoingByNodeId.get(event.id)?.length ?? 0) === 0)
    .map((event) => warning(
      'BOUNDARY_EVENT_WITHOUT_HANDLER',
      'Boundary event has no outgoing handler sequence flow',
      event.id
    ));
}

function callActivityDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  return sortedElements(indexes.byType.get('bpmn:CallActivity') ?? [])
    .filter((element) => !stringValue(indexes.rawById.get(element.id)?.calledElement))
    .map((element) => warning(
      'CALL_ACTIVITY_MISSING_CALLED_ELEMENT',
      'CallActivity has no calledElement',
      element.id
    ));
}

function isFlowNode(element: ElementSummary): boolean {
  return element.type !== 'bpmn:SequenceFlow';
}

function sortedElements(elements: ElementSummary[]): ElementSummary[] {
  return [...elements].sort(compareElement);
}

function compareElement(a: ElementSummary, b: ElementSummary): number {
  return a.id.localeCompare(b.id);
}

function warning(code: string, message: string, elementId: string, details?: Record<string, unknown>): Diagnostic {
  return {
    severity: 'warning',
    code,
    message,
    elementId,
    ...(details ? { details } : {})
  };
}

function compareDiagnostic(a: Diagnostic, b: Diagnostic): number {
  return (a.elementId ?? '').localeCompare(b.elementId ?? '')
    || a.code.localeCompare(b.code);
}
