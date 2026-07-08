import { arrayOf, normalizeName, stringValue } from '../bpmn/normalize.js';
import type {
  BpmnIndexes,
  ElementSummary,
  EventSummary,
  ImplementationKind,
  ImplementationSummary,
  LaneSummary,
  LoadedBpmnModel,
  MessageFlowSummary,
  ModdleElement,
  ParticipantSummary,
  SequenceFlowSummary
} from '../bpmn/types.js';

const FLOW_NODE_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:BoundaryEvent',
  'bpmn:Task',
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:ManualTask',
  'bpmn:CallActivity',
  'bpmn:SubProcess',
  'bpmn:AdHocSubProcess',
  'bpmn:Transaction',
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:InclusiveGateway',
  'bpmn:EventBasedGateway'
]);

const SUBPROCESS_TYPES = new Set([
  'bpmn:SubProcess',
  'bpmn:AdHocSubProcess',
  'bpmn:Transaction'
]);

export function buildIndexes(model: LoadedBpmnModel): BpmnIndexes {
  const indexes: BpmnIndexes = {
    byId: new Map(),
    byNormalizedName: new Map(),
    byType: new Map(),
    byProcessId: new Map(),
    incomingByNodeId: new Map(),
    outgoingByNodeId: new Map(),
    sequenceFlowById: new Map(),
    messageFlowById: new Map(),
    boundaryEventsByAttachedToId: new Map(),
    childrenBySubprocessId: new Map(),
    participantByProcessId: new Map(),
    lanesById: new Map(),
    lanesByProcessId: new Map(),
    lanesByElementId: new Map(),
    implementationsByElementId: new Map(),
    subprocessParentByChildId: new Map()
  };

  const elementsById = new Map<string, ModdleElement>();

  for (const process of sortElements(model.processes)) {
    const processId = idOf(process);
    if (!processId) {
      continue;
    }

    for (const laneSet of arrayOf<ModdleElement>(process.laneSets)) {
      indexLaneSet(indexes, laneSet, processId);
    }

    indexFlowElements(indexes, elementsById, arrayOf<ModdleElement>(process.flowElements), processId, null);
  }

  for (const collaboration of sortElements(model.collaborations)) {
    for (const participant of sortElements(arrayOf<ModdleElement>(collaboration.participants))) {
      const summary = summarizeParticipant(participant);
      if (summary.processId) {
        indexes.participantByProcessId.set(summary.processId, summary);
      }
    }

    for (const flow of sortElements(arrayOf<ModdleElement>(collaboration.messageFlows))) {
      const summary = summarizeMessageFlow(flow);
      if (summary) {
        indexes.messageFlowById.set(summary.id, summary);
      }
    }
  }

  for (const flow of indexes.sequenceFlowById.values()) {
    pushMap(indexes.outgoingByNodeId, flow.sourceId, flow);
    pushMap(indexes.incomingByNodeId, flow.targetId, flow);
  }

  sortIndexArrays(indexes);
  return indexes;
}

export function summarizeElement(element: ModdleElement, processId: string | null = null): ElementSummary {
  return {
    id: String(element.id),
    type: String(element.$type),
    name: stringValue(element.name),
    processId
  };
}

function indexFlowElements(
  indexes: BpmnIndexes,
  elementsById: Map<string, ModdleElement>,
  flowElements: ModdleElement[],
  processId: string,
  subprocessId: string | null
): void {
  for (const element of sortElements(flowElements)) {
    const id = idOf(element);
    const type = element.$type;
    if (!id || !type) {
      continue;
    }

    elementsById.set(id, element);

    if (type === 'bpmn:SequenceFlow') {
      const summary = summarizeSequenceFlow(element);
      if (summary) {
        indexes.sequenceFlowById.set(summary.id, summary);
        addElementSummary(indexes, { id, type, name: stringValue(element.name), processId });
      }
      continue;
    }

    if (!FLOW_NODE_TYPES.has(type)) {
      continue;
    }

    const summary = summarizeElement(element, processId);
    addElementSummary(indexes, summary);

    if (subprocessId) {
      pushMap(indexes.childrenBySubprocessId, subprocessId, summary);
      indexes.subprocessParentByChildId.set(id, subprocessId);
    }

    if (type === 'bpmn:BoundaryEvent') {
      const attachedToId = idOf(element.attachedToRef);
      if (attachedToId) {
        pushMap(indexes.boundaryEventsByAttachedToId, attachedToId, {
          ...summary,
          eventDefinitionType: eventDefinitionType(element)
        });
      }
    }

    for (const implementation of summarizeImplementations(element)) {
      pushMap(indexes.implementationsByElementId, id, implementation);
    }

    if (SUBPROCESS_TYPES.has(type)) {
      indexFlowElements(indexes, elementsById, arrayOf<ModdleElement>(element.flowElements), processId, id);
    }
  }
}

function addElementSummary(indexes: BpmnIndexes, summary: ElementSummary): void {
  indexes.byId.set(summary.id, summary);
  pushMap(indexes.byType, summary.type, summary);
  if (summary.processId) {
    pushMap(indexes.byProcessId, summary.processId, summary);
  }

  const normalizedName = normalizeName(summary.name);
  if (normalizedName) {
    pushMap(indexes.byNormalizedName, normalizedName, summary);
  }
}

function summarizeSequenceFlow(flow: ModdleElement): SequenceFlowSummary | null {
  const id = idOf(flow);
  const sourceId = idOf(flow.sourceRef);
  const targetId = idOf(flow.targetRef);
  if (!id || !sourceId || !targetId) {
    return null;
  }

  return {
    id,
    type: 'bpmn:SequenceFlow',
    name: stringValue(flow.name),
    sourceId,
    sourceName: null,
    targetId,
    targetName: null,
    condition: conditionText(flow.conditionExpression)
  };
}

function summarizeMessageFlow(flow: ModdleElement): MessageFlowSummary | null {
  const id = idOf(flow);
  if (!id) {
    return null;
  }

  return {
    id,
    type: 'bpmn:MessageFlow',
    name: stringValue(flow.name),
    sourceId: idOf(flow.sourceRef),
    sourceName: null,
    targetId: idOf(flow.targetRef),
    targetName: null
  };
}

function summarizeParticipant(participant: ModdleElement): ParticipantSummary {
  return {
    id: String(participant.id),
    name: stringValue(participant.name),
    processId: idOf(participant.processRef)
  };
}

function summarizeImplementations(element: ModdleElement): ImplementationSummary[] {
  const summaries: ImplementationSummary[] = [];
  const elementId = idOf(element);
  const elementType = element.$type;
  if (!elementId || !elementType) {
    return summaries;
  }

  const base = {
    elementId,
    elementName: stringValue(element.name),
    elementType,
    asyncBefore: booleanValue(element.asyncBefore),
    asyncAfter: booleanValue(element.asyncAfter),
    exclusive: booleanValue(element.exclusive)
  };

  addValueImplementation(summaries, base, 'delegateExpression', element.delegateExpression);
  addValueImplementation(summaries, base, 'class', element.class);
  addValueImplementation(summaries, base, 'expression', element.expression);

  if (element.type === 'external') {
    summaries.push(cleanImplementation({
      ...base,
      kind: 'externalTask',
      topic: stringValue(element.topic) ?? undefined
    }));
  }

  addValueImplementation(summaries, base, 'form', element.formKey);

  const calledElement = stringValue(element.calledElement);
  if (elementType === 'bpmn:CallActivity' && calledElement) {
    summaries.push(cleanImplementation({
      ...base,
      kind: 'callActivity',
      value: calledElement
    }));
  }

  const extensionValues = arrayOf<ModdleElement>((element.extensionElements as ModdleElement | undefined)?.values);
  for (const extension of extensionValues) {
    if (extension.$type === 'camunda:ExecutionListener' || extension.$type === 'camunda:TaskListener') {
      const listener = listenerImplementation(base, extension);
      if (listener) {
        summaries.push(listener);
      }
    }
  }

  return summaries.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function addValueImplementation(
  summaries: ImplementationSummary[],
  base: Omit<ImplementationSummary, 'kind'>,
  kind: ImplementationKind,
  value: unknown
): void {
  const string = stringValue(value);
  if (!string) {
    return;
  }

  summaries.push(cleanImplementation({
    ...base,
    kind,
    value: string
  }));
}

function listenerImplementation(
  base: Omit<ImplementationSummary, 'kind'>,
  extension: ModdleElement
): ImplementationSummary | null {
  const value = stringValue(extension.delegateExpression) ?? stringValue(extension.class) ?? stringValue(extension.expression);
  if (!value) {
    return null;
  }

  return cleanImplementation({
    ...base,
    kind: 'listener',
    value,
    details: {
      event: stringValue(extension.event),
      listenerType: extension.$type
    }
  });
}

function cleanImplementation(value: ImplementationSummary): ImplementationSummary {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as ImplementationSummary;
}

function indexLaneSet(indexes: BpmnIndexes, laneSet: ModdleElement, processId: string): void {
  for (const lane of sortElements(arrayOf<ModdleElement>(laneSet.lanes))) {
    const summary: LaneSummary = {
      id: String(lane.id),
      name: stringValue(lane.name),
      processId,
      flowNodeIds: arrayOf<unknown>(lane.flowNodeRef).map(idOf).filter((id): id is string => Boolean(id)).sort()
    };

    indexes.lanesById.set(summary.id, summary);
    pushMap(indexes.lanesByProcessId, processId, summary);

    for (const flowNodeId of summary.flowNodeIds) {
      pushMap(indexes.lanesByElementId, flowNodeId, summary);
    }

    for (const childLaneSet of arrayOf<ModdleElement>(lane.childLaneSet ? [lane.childLaneSet] : [])) {
      indexLaneSet(indexes, childLaneSet, processId);
    }
  }
}

function eventDefinitionType(element: ModdleElement): string | null {
  return arrayOf<ModdleElement>(element.eventDefinitions)[0]?.$type ?? null;
}

function conditionText(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return stringValue(value.body);
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  if (isRecord(value) && typeof value.id === 'string' && value.id.trim() !== '') {
    return value.id;
  }

  return null;
}

function pushMap<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function sortIndexArrays(indexes: BpmnIndexes): void {
  for (const map of [
    indexes.byNormalizedName,
    indexes.byType,
    indexes.byProcessId,
    indexes.incomingByNodeId,
    indexes.outgoingByNodeId,
    indexes.boundaryEventsByAttachedToId,
    indexes.childrenBySubprocessId,
    indexes.lanesByProcessId,
    indexes.lanesByElementId,
    indexes.implementationsByElementId
  ]) {
    for (const [key, values] of map.entries()) {
      map.set(key, [...values].sort((a, b) => sortKey(a).localeCompare(sortKey(b))) as never[]);
    }
  }
}

function sortElements<T extends ModdleElement>(items: T[]): T[] {
  return [...items].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function sortKey(value: unknown): string {
  if (!isRecord(value)) {
    return String(value);
  }

  return [value.id, value.elementId, value.type ?? value.$type, value.kind, value.name]
    .map((item) => (typeof item === 'string' ? item : ''))
    .join('|');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
