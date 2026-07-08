import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';
import {
  type CallActivityMapping,
  getElementDetails,
  variableCandidatesFromMappings,
  variableCandidatesFromValues
} from './elementDetails.js';

export type VariableDirection = 'read' | 'write' | 'in' | 'out' | 'pass-through' | 'unknown';

export type VariableUsage = {
  name: string;
  direction: VariableDirection;
  source: 'callActivityMapping' | 'sequenceFlowCondition' | 'implementationExpression' | 'formKey';
  element: ElementSummary;
  expression?: string;
  mapping?: CallActivityMapping;
};

export type VariableSummary = {
  name: string;
  usageCount: number;
  directions: VariableDirection[];
  elements: ElementSummary[];
};

export type CallActivityMappingsSummary = {
  element: ElementSummary;
  calledElement: string | null;
  inputMappings: CallActivityMapping[];
  outputMappings: CallActivityMapping[];
  variables: string[];
  warnings: string[];
};

export type VariablesResult = {
  variables: VariableSummary[];
  usages: VariableUsage[];
  callActivityMappings: CallActivityMappingsSummary[];
  warnings: string[];
};

export type VariablesArgs = {
  element?: string;
  name?: string;
};

export function getVariables(indexes: BpmnIndexes, args: VariablesArgs): VariablesResult {
  const usages: VariableUsage[] = [];
  const callActivityMappings: CallActivityMappingsSummary[] = [];

  for (const element of [...indexes.byId.values()].sort(compareElement)) {
    if (args.element && element.id !== args.element) {
      continue;
    }

    const details = getElementDetails(indexes, element);
    if (!details) {
      continue;
    }

    if (details.kind === 'callActivity') {
      const mappings = [...details.inputMappings, ...details.outputMappings];
      const mappingVariables = variableCandidatesFromMappings(mappings);
      if (details.outputMappings.some((mapping) => mapping.variables === 'all')) {
        mappingVariables.unshift('*');
      }

      callActivityMappings.push({
        element,
        calledElement: details.calledElement,
        inputMappings: details.inputMappings,
        outputMappings: details.outputMappings,
        variables: [...new Set(mappingVariables)].sort((a, b) => a.localeCompare(b)),
        warnings: details.warnings
      });

      for (const mapping of mappings) {
        const direction = mapping.variables === 'all'
          ? 'pass-through'
          : mapping.direction;
        const names = mapping.variables === 'all' ? ['*'] : variableCandidatesFromMappings([mapping]);
        for (const name of names) {
          usages.push(cleanUsage({
            name,
            direction,
            source: 'callActivityMapping',
            element,
            expression: mapping.sourceExpression,
            mapping
          }));
        }
      }
    }

    if (details.kind === 'sequenceFlow' && details.condition) {
      for (const name of details.variableCandidates) {
        usages.push({
          name,
          direction: 'read',
          source: 'sequenceFlowCondition',
          element,
          expression: details.condition
        });
      }
    }

    if (details.kind === 'serviceTask') {
      const values = [
        details.implementation.delegateExpression,
        details.implementation.class,
        details.implementation.expression
      ].filter((value): value is string => Boolean(value));

      for (const name of variableCandidatesFromValues(values)) {
        usages.push({
          name,
          direction: 'unknown',
          source: 'implementationExpression',
          element
        });
      }
    }

    if (details.kind === 'userTask' && details.formKey) {
      for (const name of details.variableCandidates) {
        usages.push({
          name,
          direction: 'unknown',
          source: 'formKey',
          element
        });
      }
    }
  }

  const filteredUsages = args.name
    ? usages.filter((usage) => usage.name === args.name)
    : usages;
  const filteredCallActivityMappings = args.name
    ? callActivityMappings
      .map((summary) => ({
        ...summary,
        inputMappings: summary.inputMappings.filter((mapping) => mappingHasName(mapping, args.name as string)),
        outputMappings: summary.outputMappings.filter((mapping) => mappingHasName(mapping, args.name as string)),
        variables: summary.variables.filter((name) => name === args.name)
      }))
      .filter((summary) => summary.inputMappings.length > 0 || summary.outputMappings.length > 0 || summary.variables.includes(args.name as string))
    : callActivityMappings;

  return {
    variables: summarizeVariables(filteredUsages),
    usages: filteredUsages.sort(compareUsage),
    callActivityMappings: filteredCallActivityMappings.sort((a, b) => a.element.id.localeCompare(b.element.id)),
    warnings: []
  };
}

function mappingHasName(mapping: CallActivityMapping, name: string): boolean {
  if (mapping.variables === 'all' && name === '*') {
    return true;
  }

  return variableCandidatesFromMappings([mapping]).includes(name);
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

function cleanUsage(usage: VariableUsage): VariableUsage {
  return Object.fromEntries(Object.entries(usage).filter(([, value]) => value !== undefined)) as VariableUsage;
}

function compareUsage(a: VariableUsage, b: VariableUsage): number {
  return a.name.localeCompare(b.name)
    || a.element.id.localeCompare(b.element.id)
    || compareDirection(a.direction, b.direction)
    || a.source.localeCompare(b.source);
}

function compareElement(a: ElementSummary, b: ElementSummary): number {
  return a.id.localeCompare(b.id);
}

function compareDirection(a: VariableDirection, b: VariableDirection): number {
  const order: VariableDirection[] = ['in', 'out', 'read', 'write', 'pass-through', 'unknown'];
  return order.indexOf(a) - order.indexOf(b);
}
