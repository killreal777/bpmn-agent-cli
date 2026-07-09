import { BpmnCliError } from '../bpmn/errors.js';
import type {
  BpmnIndexes,
  ElementSummary,
  EventSummary,
  ImplementationSummary,
  LaneSummary,
  ParticipantSummary,
  PathSummary
} from '../bpmn/types.js';
import { type CallActivityContract, getCallActivities } from './callActivity.js';
import { collectPaths } from './trace.js';

export type ImpactResult = {
  focus: ElementSummary;
  upstream: PathSummary[];
  downstream: PathSummary[];
  lanes: LaneSummary[];
  participant: ParticipantSummary | null;
  boundaryEvents: EventSummary[];
  implementations: ImplementationSummary[];
  callActivities: CallActivityContract[];
  affected: {
    upstreamElementIds: string[];
    downstreamElementIds: string[];
    implementationElementIds: string[];
    callActivityIds: string[];
  };
  truncated: boolean;
};

export function getImpact(indexes: BpmnIndexes, args: { id: string; depth: number; maxPaths: number }): ImpactResult {
  const focus = indexes.byId.get(args.id);
  if (!focus) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
  }

  const upstreamTraversal = collectPaths(indexes, focus, 'backward', args.depth, args.maxPaths);
  const downstreamTraversal = collectPaths(indexes, focus, 'forward', args.depth, args.maxPaths);
  const upstream = upstreamTraversal.paths.map(reversePath);
  const downstream = downstreamTraversal.paths;
  const impactedElementIds = uniqueSorted([
    focus.id,
    ...idsFromPaths(upstream),
    ...idsFromPaths(downstream)
  ]);
  const implementations = impactedElementIds
    .flatMap((id) => indexes.implementationsByElementId.get(id) ?? [])
    .sort(compareImplementation);
  const callActivityIds = impactedElementIds
    .map((id) => indexes.byId.get(id))
    .filter((element): element is ElementSummary => Boolean(element && element.type === 'bpmn:CallActivity'))
    .map((element) => element.id)
    .sort((a, b) => a.localeCompare(b));

  return {
    focus,
    upstream,
    downstream,
    lanes: [...(indexes.lanesByElementId.get(focus.id) ?? [])].sort(compareById),
    participant: focus.processId ? indexes.participantByProcessId.get(focus.processId) ?? null : null,
    boundaryEvents: [...(indexes.boundaryEventsByAttachedToId.get(focus.id) ?? [])].sort(compareById),
    implementations,
    callActivities: callActivityIds.map((id) => getCallActivities(indexes, { id }).callActivities[0]).filter((item): item is CallActivityContract => Boolean(item)),
    affected: {
      upstreamElementIds: uniqueSorted(idsFromPaths(upstream).filter((id) => id !== focus.id)),
      downstreamElementIds: uniqueSorted(idsFromPaths(downstream).filter((id) => id !== focus.id)),
      implementationElementIds: uniqueSorted(implementations.map((implementation) => implementation.elementId)),
      callActivityIds
    },
    truncated: upstreamTraversal.truncated || downstreamTraversal.truncated
  };
}

function reversePath(path: PathSummary): PathSummary {
  return {
    ...path,
    nodes: [...path.nodes].reverse(),
    flows: [...path.flows].reverse()
  };
}

function idsFromPaths(paths: PathSummary[]): string[] {
  return paths.flatMap((path) => path.nodes.map((node) => node.id));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function compareById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}

function compareImplementation(a: ImplementationSummary, b: ImplementationSummary): number {
  return [
    a.elementId.localeCompare(b.elementId),
    a.kind.localeCompare(b.kind),
    (a.value ?? '').localeCompare(b.value ?? ''),
    (a.topic ?? '').localeCompare(b.topic ?? '')
  ].find((value) => value !== 0) ?? 0;
}
