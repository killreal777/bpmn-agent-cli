import { BpmnCliError } from '../bpmn/errors.js';
import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type {
  BpmnIndexes,
  ElementSummary,
  EventDefinitionSummary,
  EventSummary,
  LoadedBpmnModel,
  ModdleElement,
  SequenceFlowSummary
} from '../bpmn/types.js';

type EventCategory = 'start' | 'end' | 'boundary' | 'intermediate' | 'other';

export type EventsResult = {
  events: Array<EventSummary & {
    category: EventCategory;
    eventDefinitions: EventDefinitionSummary[];
    attachedTo?: ElementSummary | null;
    outgoing: SequenceFlowSummary[];
    incoming: SequenceFlowSummary[];
  }>;
};

const EVENT_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:BoundaryEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent'
]);

const VALID_FILTERS = new Set<EventCategory>(['start', 'end', 'boundary', 'intermediate', 'other']);

export function getEvents(model: LoadedBpmnModel, indexes: BpmnIndexes, args: { type?: string }): EventsResult {
  if (args.type && !VALID_FILTERS.has(args.type as EventCategory)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'Invalid events --type value', 2, {
      option: '--type',
      value: args.type
    });
  }

  const filter = args.type as EventCategory | undefined;
  const events = collectFlowElements(model.processes)
    .filter((element) => typeof element.id === 'string' && EVENT_TYPES.has(String(element.$type)))
    .map((element) => summarizeEvent(element, indexes))
    .filter((event) => !filter || event.category === filter)
    .sort(sortById);

  return { events };
}

function summarizeEvent(element: ModdleElement, indexes: BpmnIndexes): EventsResult['events'][number] {
  const id = String(element.id);
  const type = String(element.$type);
  const attachedToId = idOf(element.attachedToRef);

  return {
    id,
    type,
    name: stringValue(element.name),
    processId: indexes.byId.get(id)?.processId ?? null,
    eventDefinitionType: arrayOf<ModdleElement>(element.eventDefinitions)[0]?.$type ?? null,
    category: categoryFor(type),
    eventDefinitions: arrayOf<ModdleElement>(element.eventDefinitions).map(summarizeEventDefinition),
    attachedTo: attachedToId ? indexes.byId.get(attachedToId) ?? null : null,
    outgoing: indexes.outgoingByNodeId.get(id) ?? [],
    incoming: indexes.incomingByNodeId.get(id) ?? []
  };
}

function collectFlowElements(processes: ModdleElement[]): ModdleElement[] {
  const result: ModdleElement[] = [];
  for (const process of processes) {
    visitFlowElements(arrayOf<ModdleElement>(process.flowElements), result);
  }
  return result;
}

function visitFlowElements(elements: ModdleElement[], result: ModdleElement[]): void {
  for (const element of elements) {
    result.push(element);
    visitFlowElements(arrayOf<ModdleElement>(element.flowElements), result);
  }
}

function categoryFor(type: string): EventCategory {
  if (type === 'bpmn:StartEvent') {
    return 'start';
  }
  if (type === 'bpmn:EndEvent') {
    return 'end';
  }
  if (type === 'bpmn:BoundaryEvent') {
    return 'boundary';
  }
  if (type === 'bpmn:IntermediateCatchEvent' || type === 'bpmn:IntermediateThrowEvent') {
    return 'intermediate';
  }
  return 'other';
}

function summarizeEventDefinition(definition: ModdleElement): EventDefinitionSummary {
  const value = timerValue(definition);
  const ref = refValue(definition);
  return {
    type: String(definition.$type),
    ...(value ? { value } : {}),
    ...(ref.id ? { refId: ref.id } : {}),
    ...(ref.name ? { refName: ref.name } : {})
  };
}

function timerValue(definition: ModdleElement): string | null {
  for (const key of ['timeDuration', 'timeDate', 'timeCycle']) {
    const candidate = definition[key];
    if (isRecord(candidate)) {
      const value = stringValue(candidate.body);
      if (value) {
        return value;
      }
    }
  }
  return null;
}

function refValue(definition: ModdleElement): { id: string | null; name: string | null } {
  for (const key of ['messageRef', 'errorRef', 'signalRef', 'escalationRef']) {
    const candidate = definition[key];
    const id = idOf(candidate);
    if (id) {
      return { id, name: isRecord(candidate) ? stringValue(candidate.name) : null };
    }
  }
  return { id: null, name: null };
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (isRecord(value) && typeof value.id === 'string') {
    return value.id;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
