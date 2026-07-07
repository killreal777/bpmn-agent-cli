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

export function getContext(
  indexes: BpmnIndexes,
  args: { id: string; before: number; after: number; maxPaths: number }
): ContextResult {
  const focus = indexes.byId.get(args.id);
  if (!focus) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
  }

  const before = collectPaths(indexes, focus, 'backward', args.before, args.maxPaths);
  const after = collectPaths(indexes, focus, 'forward', args.after, args.maxPaths);

  return {
    focus,
    before: before.paths.map(reversePath),
    after: after.paths,
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(focus.id) ?? [],
    truncated: before.truncated || after.truncated
  };
}

function reversePath(path: PathSummary): PathSummary {
  return {
    ...path,
    nodes: [...path.nodes].reverse(),
    flows: [...path.flows].reverse()
  };
}
