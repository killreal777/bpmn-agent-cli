import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, LaneSummary } from '../bpmn/types.js';

export type LanesResult = {
  lanes: Array<{
    id: string;
    name: string | null;
    processId: string | null;
    flowNodes: ElementSummary[];
  }>;
  elementLanes: Array<{
    element: ElementSummary;
    lanes: LaneSummary[];
  }>;
};

export function getLanes(indexes: BpmnIndexes, args: { elementId?: string }): LanesResult {
  if (args.elementId) {
    const element = indexes.byId.get(args.elementId);
    if (!element) {
      throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
    }

    const lanes = [...(indexes.lanesByElementId.get(args.elementId) ?? [])].sort(sortById);
    return {
      lanes: lanes.map((lane) => expandLane(indexes, lane)),
      elementLanes: [{ element, lanes }]
    };
  }

  return {
    lanes: [...indexes.lanesById.values()].sort(sortById).map((lane) => expandLane(indexes, lane)),
    elementLanes: []
  };
}

function expandLane(indexes: BpmnIndexes, lane: LaneSummary): LanesResult['lanes'][number] {
  return {
    id: lane.id,
    name: lane.name,
    processId: lane.processId,
    flowNodes: lane.flowNodeIds
      .map((id) => indexes.byId.get(id))
      .filter((element): element is ElementSummary => Boolean(element))
      .sort(sortById)
  };
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
