import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, PathSummary } from '../bpmn/types.js';

export type TraceResult = {
  from: ElementSummary;
  direction: 'forward' | 'backward';
  depth: number;
  paths: PathSummary[];
  truncated: boolean;
};

export type TraceArgs = {
  from: string;
  direction: 'forward' | 'backward';
  depth: number;
  maxPaths: number;
};

export function trace(indexes: BpmnIndexes, args: TraceArgs): TraceResult {
  const start = indexes.byId.get(args.from);
  if (!start) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.from });
  }

  const traversal = collectPaths(indexes, start, args.direction, args.depth, args.maxPaths);
  return {
    from: start,
    direction: args.direction,
    depth: args.depth,
    paths: traversal.paths,
    truncated: traversal.truncated
  };
}

export function collectPaths(
  indexes: BpmnIndexes,
  start: ElementSummary,
  direction: 'forward' | 'backward',
  depth: number,
  maxPaths: number
): { paths: PathSummary[]; truncated: boolean } {
  const paths: PathSummary[] = [];
  let truncated = false;

  function visit(nodes: ElementSummary[], flows: PathSummary['flows'], remainingDepth: number, seen: Set<string>, cycleDetected = false): void {
    const current = nodes[nodes.length - 1];
    const nextFlows = direction === 'forward'
      ? indexes.outgoingByNodeId.get(current.id) ?? []
      : indexes.incomingByNodeId.get(current.id) ?? [];

    if (remainingDepth === 0 || nextFlows.length === 0 || cycleDetected) {
      if (paths.length < maxPaths) {
        paths.push({ nodes, flows, depth: flows.length, cycleDetected: cycleDetected || undefined });
      } else {
        truncated = true;
      }
      return;
    }

    for (const flow of nextFlows) {
      if (paths.length >= maxPaths) {
        truncated = true;
        return;
      }

      const nextId = direction === 'forward' ? flow.targetId : flow.sourceId;
      const next = indexes.byId.get(nextId);
      if (!next) {
        continue;
      }

      const repeated = seen.has(next.id);
      visit(
        [...nodes, next],
        [...flows, { id: flow.id, name: flow.name, condition: flow.condition }],
        remainingDepth - 1,
        new Set([...seen, next.id]),
        repeated
      );
    }
  }

  visit([start], [], depth, new Set([start.id]));
  return { paths, truncated };
}
