import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type { BpmnIndexes, LoadedBpmnModel, MessageFlowSummary, ModdleElement, ParticipantSummary } from '../bpmn/types.js';

export type ParticipantsResult = {
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: ParticipantSummary[];
    messageFlows: MessageFlowSummary[];
  }>;
  unreferencedProcesses: Array<{
    id: string;
    name: string | null;
  }>;
};

export function getParticipants(model: LoadedBpmnModel, indexes: BpmnIndexes): ParticipantsResult {
  const referencedProcessIds = new Set<string>();
  const collaborations = model.collaborations
    .map((collaboration) => {
      const participants = arrayOf<ModdleElement>(collaboration.participants)
        .map((participant) => ({
          id: String(participant.id),
          name: stringValue(participant.name),
          processId: idOf(participant.processRef)
        }))
        .sort(sortById);

      for (const participant of participants) {
        if (participant.processId) {
          referencedProcessIds.add(participant.processId);
        }
      }

      return {
        id: String(collaboration.id),
        name: stringValue(collaboration.name),
        participants,
        messageFlows: arrayOf<ModdleElement>(collaboration.messageFlows)
          .map((flow) => indexes.messageFlowById.get(String(flow.id)))
          .filter((flow): flow is MessageFlowSummary => Boolean(flow))
          .sort(sortById)
      };
    })
    .sort(sortById);

  return {
    collaborations,
    unreferencedProcesses: model.processes
      .map((process) => ({ id: String(process.id), name: stringValue(process.name) }))
      .filter((process) => !referencedProcessIds.has(process.id))
      .sort(sortById)
  };
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string') {
    return value.id;
  }

  return null;
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
