import type { BpmnIndexes, Diagnostic } from '../bpmn/types.js';
import { getCallActivities } from '../query/callActivity.js';
import { getVariables, type VariableUsage } from '../query/variables.js';
import type { CallActivityMapping } from '../query/elementDetails.js';

export function variableLintDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  return [
    ...callActivityMappingDiagnostics(indexes),
    ...conditionProducerDiagnostics(indexes)
  ].sort(compareDiagnostic);
}

function callActivityMappingDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const contracts = getCallActivities(indexes, {}).callActivities;

  for (const contract of contracts) {
    const mappings = [...contract.inputMappings, ...contract.outputMappings];
    if (mappings.length === 0 && !contract.passThrough) {
      diagnostics.push(warning(
        'CALL_ACTIVITY_WITHOUT_MAPPINGS',
        'CallActivity has no explicit input/output mappings or variables pass-through',
        contract.element.id
      ));
    }

    for (const mapping of contract.inputMappings) {
      if (!mapping.target) {
        diagnostics.push(warning(
          'CALL_ACTIVITY_IN_MISSING_TARGET',
          'CallActivity input mapping has no target variable',
          contract.element.id,
          mappingDetails(mapping)
        ));
      }

      if (mapping.sourceExpression && !mapping.target) {
        diagnostics.push(warning(
          'CALL_ACTIVITY_SOURCE_EXPRESSION_WITHOUT_TARGET',
          'CallActivity sourceExpression mapping has no target variable',
          contract.element.id,
          mappingDetails(mapping)
        ));
      }
    }

    for (const mapping of contract.outputMappings) {
      if (mapping.variables === 'all') {
        diagnostics.push(warning(
          'CALL_ACTIVITY_VARIABLES_ALL_PASS_THROUGH',
          'CallActivity passes through all variables',
          contract.element.id,
          mappingDetails(mapping)
        ));
        continue;
      }

      if (!mapping.target) {
        diagnostics.push(warning(
          'CALL_ACTIVITY_OUT_MISSING_TARGET',
          'CallActivity output mapping has no target variable',
          contract.element.id,
          mappingDetails(mapping)
        ));
      }
    }
  }

  return diagnostics;
}

function conditionProducerDiagnostics(indexes: BpmnIndexes): Diagnostic[] {
  const variables = getVariables(indexes, {});
  const produced = new Set(
    variables.usages
      .filter((usage) => usage.direction === 'out' || usage.direction === 'write')
      .map((usage) => usage.name)
  );

  const conditionReads = variables.usages.filter((usage) => usage.source === 'sequenceFlowCondition' && usage.direction === 'read');

  return conditionReads
    .filter((usage) => !isProduced(usage, produced))
    .map((usage) => warning(
      'CONDITION_VARIABLE_WITHOUT_PRODUCER',
      'Sequence-flow condition reads a variable with no detected producer',
      usage.element.id,
      { variable: usage.name, expression: usage.expression ?? null }
    ));
}

function isProduced(usage: VariableUsage, produced: Set<string>): boolean {
  return produced.has(usage.name);
}

function mappingDetails(mapping: CallActivityMapping): Record<string, unknown> {
  return Object.fromEntries(Object.entries(mapping).filter(([, value]) => value !== undefined));
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
