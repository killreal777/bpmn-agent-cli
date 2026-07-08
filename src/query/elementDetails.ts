import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type { BpmnIndexes, ElementSummary, ModdleElement } from '../bpmn/types.js';

export type CallActivityMapping = {
  direction: 'in' | 'out';
  source?: string;
  sourceExpression?: string;
  target?: string;
  variables?: string;
  businessKey?: string;
  local?: boolean;
};

export type ElementDetails =
  | {
    kind: 'callActivity';
    calledElement: string | null;
    inputMappings: CallActivityMapping[];
    outputMappings: CallActivityMapping[];
    variableCandidates: string[];
    warnings: string[];
  }
  | {
    kind: 'serviceTask';
    implementation: {
      type: string | null;
      topic: string | null;
      delegateExpression: string | null;
      class: string | null;
      expression: string | null;
    };
    variableCandidates: string[];
  }
  | {
    kind: 'userTask';
    formKey: string | null;
    variableCandidates: string[];
  }
  | {
    kind: 'sequenceFlow';
    condition: string | null;
    variableCandidates: string[];
  }
  | {
    kind: 'boundaryEvent';
    attachedTo: ElementSummary | null;
    cancelActivity: boolean | null;
    eventDefinitions: Array<{
      type: string;
      value?: string | null;
      refId?: string | null;
      refName?: string | null;
    }>;
  };

export function getElementDetails(indexes: BpmnIndexes, element: ElementSummary): ElementDetails | undefined {
  const raw = indexes.rawById.get(element.id);
  if (!raw) {
    return undefined;
  }

  if (element.type === 'bpmn:CallActivity') {
    return callActivityDetails(raw);
  }

  if (element.type === 'bpmn:ServiceTask') {
    return serviceTaskDetails(raw);
  }

  if (element.type === 'bpmn:UserTask') {
    return userTaskDetails(raw);
  }

  if (element.type === 'bpmn:SequenceFlow') {
    return sequenceFlowDetails(raw);
  }

  if (element.type === 'bpmn:BoundaryEvent') {
    return boundaryEventDetails(indexes, raw);
  }

  return undefined;
}

function callActivityDetails(element: ModdleElement): ElementDetails {
  const extensionValues = arrayOf<ModdleElement>((element.extensionElements as ModdleElement | undefined)?.values);
  const mappings = extensionValues
    .map(mappingSummary)
    .filter((mapping): mapping is CallActivityMapping => Boolean(mapping));
  const inputMappings = mappings.filter((mapping) => mapping.direction === 'in');
  const outputMappings = mappings.filter((mapping) => mapping.direction === 'out');
  const variableCandidates = variableCandidatesFromMappings(mappings);

  return {
    kind: 'callActivity',
    calledElement: stringValue(element.calledElement),
    inputMappings,
    outputMappings,
    variableCandidates,
    warnings: []
  };
}

function mappingSummary(element: ModdleElement): CallActivityMapping | null {
  if (element.$type !== 'camunda:In' && element.$type !== 'camunda:Out') {
    return null;
  }

  const direction: CallActivityMapping['direction'] = element.$type === 'camunda:In' ? 'in' : 'out';

  return clean({
    direction,
    source: stringValue(element.source) ?? undefined,
    sourceExpression: stringValue(element.sourceExpression) ?? undefined,
    target: stringValue(element.target) ?? undefined,
    variables: stringValue(element.variables) ?? undefined,
    businessKey: stringValue(element.businessKey) ?? undefined,
    local: booleanValue(element.local)
  });
}

function serviceTaskDetails(element: ModdleElement): ElementDetails {
  const expressions = [
    stringValue(element.delegateExpression),
    stringValue(element.class),
    stringValue(element.expression),
    stringValue(element.topic)
  ].filter((value): value is string => Boolean(value));

  return {
    kind: 'serviceTask',
    implementation: {
      type: stringValue(element.type),
      topic: stringValue(element.topic),
      delegateExpression: stringValue(element.delegateExpression),
      class: stringValue(element.class),
      expression: stringValue(element.expression)
    },
    variableCandidates: variableCandidatesFromValues(expressions)
  };
}

function userTaskDetails(element: ModdleElement): ElementDetails {
  const formKey = stringValue(element.formKey);

  return {
    kind: 'userTask',
    formKey,
    variableCandidates: variableCandidatesFromValues(formKey ? [formKey] : [])
  };
}

function sequenceFlowDetails(element: ModdleElement): ElementDetails {
  const condition = conditionText(element.conditionExpression);

  return {
    kind: 'sequenceFlow',
    condition,
    variableCandidates: variableCandidatesFromValues(condition ? [condition] : [])
  };
}

function boundaryEventDetails(indexes: BpmnIndexes, element: ModdleElement): ElementDetails {
  const attachedToId = idOf(element.attachedToRef);

  return {
    kind: 'boundaryEvent',
    attachedTo: attachedToId ? indexes.byId.get(attachedToId) ?? null : null,
    cancelActivity: booleanValue(element.cancelActivity) ?? null,
    eventDefinitions: arrayOf<ModdleElement>(element.eventDefinitions).map(eventDefinitionSummary)
  };
}

function eventDefinitionSummary(element: ModdleElement): { type: string; value?: string | null; refId?: string | null; refName?: string | null } {
  return clean({
    type: String(element.$type),
    value: timerValue(element) ?? undefined,
    refId: idOf(element.messageRef) ?? idOf(element.errorRef) ?? idOf(element.signalRef) ?? idOf(element.escalationRef) ?? undefined,
    refName: nameOf(element.messageRef) ?? nameOf(element.errorRef) ?? nameOf(element.signalRef) ?? nameOf(element.escalationRef) ?? undefined
  });
}

function timerValue(element: ModdleElement): string | null {
  return expressionBody(element.timeDuration) ?? expressionBody(element.timeDate) ?? expressionBody(element.timeCycle);
}

function expressionBody(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return stringValue(value.body);
}

function conditionText(value: unknown): string | null {
  return expressionBody(value);
}

function variableCandidatesFromMappings(mappings: CallActivityMapping[]): string[] {
  const values = mappings.flatMap((mapping) => [
    mapping.source,
    mapping.sourceExpression,
    mapping.target,
    mapping.businessKey
  ]).filter((value): value is string => Boolean(value));

  return variableCandidatesFromValues(values);
}

function variableCandidatesFromValues(values: string[]): string[] {
  const candidates = new Set<string>();

  for (const value of values) {
    for (const candidate of extractVariableCandidates(value)) {
      candidates.add(candidate);
    }
  }

  return [...candidates].sort((a, b) => a.localeCompare(b));
}

function extractVariableCandidates(value: string): string[] {
  const withoutStrings = value.replace(/'[^']*'|"[^"]*"/g, ' ');
  const tokens = withoutStrings.match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? [];
  const reserved = new Set(['all', 'and', 'or', 'not', 'true', 'false', 'null']);

  return tokens.filter((token) => !reserved.has(token));
}

function booleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
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

function nameOf(value: unknown): string | null {
  return isRecord(value) ? stringValue(value.name) : null;
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
