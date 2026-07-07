import type { BpmnIndexes, ImplementationKind, ImplementationSummary } from '../bpmn/types.js';

export type ImplementationsResult = {
  serviceTasks: ImplementationSummary[];
  callActivities: ImplementationSummary[];
  listeners: ImplementationSummary[];
  forms: ImplementationSummary[];
};

export function listImplementations(indexes: BpmnIndexes, args: { type?: ImplementationKind | string }): ImplementationsResult {
  const all = [...indexes.implementationsByElementId.values()].flat();
  const filtered = args.type ? all.filter((implementation) => implementation.kind === args.type) : all;

  return {
    serviceTasks: filtered.filter((implementation) => implementation.elementType === 'bpmn:ServiceTask' && !['listener', 'form'].includes(implementation.kind)),
    callActivities: filtered.filter((implementation) => implementation.kind === 'callActivity'),
    listeners: filtered.filter((implementation) => implementation.kind === 'listener'),
    forms: filtered.filter((implementation) => implementation.kind === 'form')
  };
}
