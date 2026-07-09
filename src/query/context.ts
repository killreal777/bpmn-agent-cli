import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, EventSummary, PathSummary } from '../bpmn/types.js';
import { collectPaths } from './trace.js';

export type ContextResult = {
  focus: ElementSummary;
  before: PathSummary[];
  after: PathSummary[];
  boundaryEvents: Array<EventSummary & { targetPath?: PathSummary | null }>;
  truncated: boolean;
};

export type CompactPathSummary = {
  nodeIds: string[];
  flowIds: string[];
  conditions: Array<{ flowId: string; condition: string }>;
  depth: number;
  cycleDetected?: boolean;
};

export type AgentContextResult = {
  profile: 'agent';
  focus: ElementSummary;
  incoming: Array<{
    flowId: string;
    sourceId: string;
    condition: string | null;
  }>;
  outgoing: Array<{
    flowId: string;
    targetId: string;
    condition: string | null;
  }>;
  before: CompactPathSummary[];
  after: CompactPathSummary[];
  boundaryEvents: Array<{
    id: string;
    name: string | null;
    type: string;
    eventDefinitionType?: string | null;
  }>;
  truncated: boolean;
};

export function getContext(
  indexes: BpmnIndexes,
  args: { id: string; before: number; after: number; maxPaths: number; profile?: 'full' | 'agent' }
): ContextResult | AgentContextResult {
  const focus = indexes.byId.get(args.id);
  if (!focus) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
  }

  const before = collectPaths(indexes, focus, 'backward', args.before, args.maxPaths);
  const after = collectPaths(indexes, focus, 'forward', args.after, args.maxPaths);
  const beforePaths = before.paths.map(reversePath);
  const afterPaths = after.paths;
  const truncated = before.truncated || after.truncated;

  if (args.profile === 'agent') {
    return {
      profile: 'agent',
      focus,
      incoming: (indexes.incomingByNodeId.get(focus.id) ?? []).map((flow) => ({
        flowId: flow.id,
        sourceId: flow.sourceId,
        condition: flow.condition
      })),
      outgoing: (indexes.outgoingByNodeId.get(focus.id) ?? []).map((flow) => ({
        flowId: flow.id,
        targetId: flow.targetId,
        condition: flow.condition
      })),
      before: beforePaths.map(compactPath),
      after: afterPaths.map(compactPath),
      boundaryEvents: (indexes.boundaryEventsByAttachedToId.get(focus.id) ?? []).map((event) => ({
        id: event.id,
        name: event.name,
        type: event.type,
        ...(event.eventDefinitionType !== undefined ? { eventDefinitionType: event.eventDefinitionType } : {})
      })),
      truncated
    };
  }

  return {
    focus,
    before: beforePaths,
    after: afterPaths,
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(focus.id) ?? [],
    truncated
  };
}

function reversePath(path: PathSummary): PathSummary {
  return {
    ...path,
    nodes: [...path.nodes].reverse(),
    flows: [...path.flows].reverse()
  };
}

function compactPath(path: PathSummary): CompactPathSummary {
  return {
    nodeIds: path.nodes.map((node) => node.id),
    flowIds: path.flows.map((flow) => flow.id),
    conditions: path.flows
      .filter((flow): flow is { id: string; name: string | null; condition: string } => Boolean(flow.condition))
      .map((flow) => ({ flowId: flow.id, condition: flow.condition })),
    depth: path.depth,
    ...(path.cycleDetected ? { cycleDetected: true } : {})
  };
}
