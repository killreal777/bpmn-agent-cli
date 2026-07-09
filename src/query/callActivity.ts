import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';
import {
  type CallActivityMapping,
  getElementDetails,
  variableCandidatesFromMappings
} from './elementDetails.js';
import type { VariableDirection, VariableSummary, VariableUsage } from './variables.js';

export type CallActivityContract = {
  element: ElementSummary;
  calledElement: string | null;
  inputMappings: CallActivityMapping[];
  outputMappings: CallActivityMapping[];
  variables: string[];
  passThrough: boolean;
  businessKey: string | null;
  warnings: string[];
};

export type CallActivityResult = {
  callActivities: CallActivityContract[];
  variables: VariableSummary[];
  warnings: string[];
};

export type CallActivityArgs = {
  id?: string;
};

export function getCallActivities(indexes: BpmnIndexes, args: CallActivityArgs): CallActivityResult {
  const elements = args.id
    ? [requiredCallActivity(indexes, args.id)]
    : [...(indexes.byType.get('bpmn:CallActivity') ?? [])].sort(compareElement);

  const callActivities = elements.map((element) => buildContract(indexes, element));
  const usages = callActivities.flatMap((contract) => variableUsages(contract));

  return {
    callActivities,
    variables: summarizeVariables(usages),
    warnings: [...new Set(callActivities.flatMap((contract) => contract.warnings))].sort((a, b) => a.localeCompare(b))
  };
}

function requiredCallActivity(indexes: BpmnIndexes, id: string): ElementSummary {
  const element = indexes.byId.get(id);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: id }, suggestions(indexes, id));
  }

  if (element.type !== 'bpmn:CallActivity') {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Element is not a CallActivity', 1, {
      elementId: id,
      type: element.type,
      expectedType: 'bpmn:CallActivity'
    });
  }

  return element;
}

function buildContract(indexes: BpmnIndexes, element: ElementSummary): CallActivityContract {
  const details = getElementDetails(indexes, element);
  if (!details || details.kind !== 'callActivity') {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Element is not a CallActivity', 1, {
      elementId: element.id,
      type: element.type,
      expectedType: 'bpmn:CallActivity'
    });
  }

  const mappings = [...details.inputMappings, ...details.outputMappings];
  const variableNames = variableCandidatesFromMappings(mappings);
  const passThrough = details.outputMappings.some((mapping) => mapping.variables === 'all');
  if (passThrough) {
    variableNames.unshift('*');
  }

  return {
    element,
    calledElement: details.calledElement,
    inputMappings: details.inputMappings,
    outputMappings: details.outputMappings,
    variables: [...new Set(variableNames)].sort((a, b) => a.localeCompare(b)),
    passThrough,
    businessKey: mappings.find((mapping) => mapping.businessKey)?.businessKey ?? null,
    warnings: details.warnings
  };
}

function variableUsages(contract: CallActivityContract): VariableUsage[] {
  return [...contract.inputMappings, ...contract.outputMappings].flatMap((mapping) => {
    const names = mapping.variables === 'all' ? ['*'] : variableCandidatesFromMappings([mapping]);
    const direction: VariableDirection = mapping.variables === 'all' ? 'pass-through' : mapping.direction;

    return names.map((name) => clean({
      name,
      direction,
      source: 'callActivityMapping',
      element: contract.element,
      expression: mapping.sourceExpression,
      mapping
    }));
  });
}

function summarizeVariables(usages: VariableUsage[]): VariableSummary[] {
  const byName = new Map<string, VariableUsage[]>();

  for (const usage of usages) {
    byName.set(usage.name, [...(byName.get(usage.name) ?? []), usage]);
  }

  return [...byName.entries()]
    .map(([name, items]) => ({
      name,
      usageCount: items.length,
      directions: [...new Set(items.map((item) => item.direction))].sort(compareDirection),
      elements: uniqueElements(items.map((item) => item.element))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueElements(elements: ElementSummary[]): ElementSummary[] {
  const byId = new Map<string, ElementSummary>();
  for (const element of elements) {
    byId.set(element.id, element);
  }

  return [...byId.values()].sort(compareElement);
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

function compareElement(a: ElementSummary, b: ElementSummary): number {
  return a.id.localeCompare(b.id);
}

function compareDirection(a: VariableDirection, b: VariableDirection): number {
  const order: VariableDirection[] = ['in', 'out', 'read', 'write', 'pass-through', 'unknown'];
  return order.indexOf(a) - order.indexOf(b);
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
