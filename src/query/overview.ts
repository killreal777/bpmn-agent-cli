import type { BpmnIndexes, Diagnostic, LoadedBpmnModel, ModdleElement } from '../bpmn/types.js';
import { validateModel } from '../validate/validateModel.js';

export type OverviewResult = {
  definitions: { id: string | null };
  processes: Array<{
    id: string;
    name: string | null;
    flowNodes: number;
    sequenceFlows: number;
  }>;
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: number;
    messageFlows: number;
  }>;
  counts: {
    tasks: Record<string, number>;
    gateways: Record<string, number>;
    events: Record<string, number>;
    sequenceFlows: number;
    messageFlows: number;
  };
  extensions: string[];
  diagnosticsSummary: { errors: number; warnings: number; infos: number };
  warnings: Diagnostic[];
};

const TASK_TYPES = new Set([
  'bpmn:Task',
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:SendTask',
  'bpmn:ReceiveTask',
  'bpmn:ManualTask'
]);

const GATEWAY_TYPES = new Set([
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:InclusiveGateway',
  'bpmn:EventBasedGateway'
]);

const EVENT_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:BoundaryEvent'
]);

export function getOverview(model: LoadedBpmnModel, indexes: BpmnIndexes): OverviewResult {
  const diagnostics = validateModel(model, indexes);

  return {
    definitions: { id: stringOrNull(model.definitions.id) },
    processes: model.processes
      .map((process) => summarizeProcess(process))
      .sort((a, b) => a.id.localeCompare(b.id)),
    collaborations: model.collaborations
      .map((collaboration) => ({
        id: String(collaboration.id),
        name: stringOrNull(collaboration.name),
        participants: arrayOf(collaboration.participants).length,
        messageFlows: arrayOf(collaboration.messageFlows).length
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    counts: {
      tasks: countTypes(indexes, TASK_TYPES),
      gateways: countTypes(indexes, GATEWAY_TYPES),
      events: countTypes(indexes, EVENT_TYPES),
      sequenceFlows: indexes.sequenceFlowById.size,
      messageFlows: indexes.messageFlowById.size
    },
    extensions: detectExtensions(model),
    diagnosticsSummary: {
      errors: diagnostics.errors.length,
      warnings: diagnostics.warnings.length,
      infos: diagnostics.infos.length
    },
    warnings: diagnostics.warnings
  };
}

function summarizeProcess(process: ModdleElement): OverviewResult['processes'][number] {
  const flowElements = arrayOf<ModdleElement>(process.flowElements);
  return {
    id: String(process.id),
    name: stringOrNull(process.name),
    flowNodes: flowElements.filter((element) => element.$type !== 'bpmn:SequenceFlow').length,
    sequenceFlows: flowElements.filter((element) => element.$type === 'bpmn:SequenceFlow').length
  };
}

function countTypes(indexes: BpmnIndexes, types: Set<string>): Record<string, number> {
  return Object.fromEntries([...types]
    .map((type) => [type, indexes.byType.get(type)?.length ?? 0] as const)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b)));
}

function detectExtensions(model: LoadedBpmnModel): string[] {
  const serialized = model.xml;
  return [
    serialized.includes('camunda.org/schema') ? 'camunda' : null
  ].filter((item): item is string => item !== null);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function arrayOf<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
