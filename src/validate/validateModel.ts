import type { BpmnIndexes, Diagnostic, LoadedBpmnModel } from '../bpmn/types.js';

export type ValidateResult = {
  valid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
  infos: Diagnostic[];
};

export function validateModel(_model: LoadedBpmnModel, _indexes: BpmnIndexes): ValidateResult {
  return {
    valid: true,
    errors: [],
    warnings: [],
    infos: []
  };
}
