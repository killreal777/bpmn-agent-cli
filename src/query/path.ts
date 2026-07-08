import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, PathSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type PathResult = {
  from: ElementSummary;
  to: ElementSummary;
  direction: 'forward' | 'backward';
  depth: number;
  paths: PathSummary[];
  found: boolean;
  truncated: boolean;
};

export type PathArgs = {
  from: string;
  to: string;
  direction: 'forward' | 'backward';
  depth: number;
  maxPaths: number;
};

type QueueItem = {
  nodes: ElementSummary[];
  flows: PathSummary['flows'];
  seen: Set<string>;
  cycleDetected?: boolean;
};

export function findPaths(indexes: BpmnIndexes, args: PathArgs): PathResult {
  const from = indexes.byId.get(args.from);
  const to = indexes.byId.get(args.to);
  if (!from) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.from });
  }
  if (!to) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.to });
  }

  const paths = collectTargetPaths(indexes, from, to, args.direction, args.depth, args.maxPaths);
  return {
    from,
    to,
    direction: args.direction,
    depth: args.depth,
    paths: paths.paths,
    found: paths.paths.length > 0,
    truncated: paths.truncated
  };
}

function collectTargetPaths(
  indexes: BpmnIndexes,
  from: ElementSummary,
  to: ElementSummary,
  direction: 'forward' | 'backward',
  depth: number,
  maxPaths: number
): { paths: PathSummary[]; truncated: boolean } {
  const queue: QueueItem[] = [{ nodes: [from], flows: [], seen: new Set([from.id]) }];
  const paths: PathSummary[] = [];
  let truncated = false;

  while (queue.length > 0) {
    const item = queue.shift() as QueueItem;
    const current = item.nodes[item.nodes.length - 1];

    if (current.id === to.id && item.flows.length > 0) {
      if (paths.length < maxPaths) {
        paths.push({
          nodes: item.nodes,
          flows: item.flows,
          depth: item.flows.length,
          cycleDetected: item.cycleDetected || undefined
        });
      } else {
        truncated = true;
      }
      continue;
    }

    if (item.cycleDetected) {
      continue;
    }

    if (item.flows.length >= depth) {
      truncated = true;
      continue;
    }

    for (const flow of nextFlows(indexes, current.id, direction)) {
      const nextId = direction === 'forward' ? flow.targetId : flow.sourceId;
      const next = indexes.byId.get(nextId);
      if (!next) {
        continue;
      }

      const repeated = item.seen.has(next.id);
      queue.push({
        nodes: [...item.nodes, next],
        flows: [...item.flows, { id: flow.id, name: flow.name, condition: flow.condition }],
        seen: new Set([...item.seen, next.id]),
        cycleDetected: item.cycleDetected || repeated || undefined
      });
    }
  }

  return { paths: paths.sort(comparePath), truncated };
}

function nextFlows(indexes: BpmnIndexes, id: string, direction: 'forward' | 'backward'): SequenceFlowSummary[] {
  const flows = direction === 'forward'
    ? indexes.outgoingByNodeId.get(id) ?? []
    : indexes.incomingByNodeId.get(id) ?? [];

  return [...flows].sort((a, b) => a.id.localeCompare(b.id));
}

function comparePath(a: PathSummary, b: PathSummary): number {
  return a.depth - b.depth
    || a.nodes.map((node) => node.id).join('|').localeCompare(b.nodes.map((node) => node.id).join('|'))
    || a.flows.map((flow) => flow.id).join('|').localeCompare(b.flows.map((flow) => flow.id).join('|'));
}
