import { arrayOf } from '../bpmn/normalize.js';
import type { BpmnIndexes, Diagnostic, LoadedBpmnModel, ModdleElement } from '../bpmn/types.js';
import { variableLintDiagnostics } from './variableLint.js';

export type ValidateResult = {
  valid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
  infos: Diagnostic[];
};

export function validateModel(model: LoadedBpmnModel, indexes: BpmnIndexes): ValidateResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  for (const process of model.processes) {
    for (const element of arrayOf<ModdleElement>(process.flowElements)) {
      if (element.$type !== 'bpmn:SequenceFlow' || !element.id) {
        continue;
      }

      if (!element.sourceRef) {
        errors.push({
          severity: 'error',
          code: 'BROKEN_SEQUENCE_FLOW_SOURCE',
          message: 'Sequence flow source does not exist',
          elementId: element.id
        });
      }

      if (!element.targetRef) {
        errors.push({
          severity: 'error',
          code: 'BROKEN_SEQUENCE_FLOW_TARGET',
          message: 'Sequence flow target does not exist',
          elementId: element.id
        });
      }
    }
  }

  for (const flow of indexes.sequenceFlowById.values()) {
    if (!indexes.byId.has(flow.sourceId)) {
      errors.push({
        severity: 'error',
        code: 'BROKEN_SEQUENCE_FLOW_SOURCE',
        message: 'Sequence flow source does not exist',
        elementId: flow.id,
        details: { sourceRef: flow.sourceId }
      });
    }
    if (!indexes.byId.has(flow.targetId)) {
      errors.push({
        severity: 'error',
        code: 'BROKEN_SEQUENCE_FLOW_TARGET',
        message: 'Sequence flow target does not exist',
        elementId: flow.id,
        details: { targetRef: flow.targetId }
      });
    }
  }

  for (const element of indexes.byId.values()) {
    if (element.type.endsWith('Task')) {
      const incoming = indexes.incomingByNodeId.get(element.id)?.length ?? 0;
      const outgoing = indexes.outgoingByNodeId.get(element.id)?.length ?? 0;
      if (incoming === 0 || outgoing === 0) {
        warnings.push({
          severity: 'warning',
          code: 'TASK_WITHOUT_COMPLETE_FLOW',
          message: 'Task has no incoming or outgoing sequence flow',
          elementId: element.id,
          details: { incoming, outgoing }
        });
      }
    }
  }

  warnings.push(...variableLintDiagnostics(indexes));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos: []
  };
}
