import { BpmnCliError } from '../bpmn/errors.js';
import { normalizeName } from '../bpmn/normalize.js';
import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';
import { TYPE_ALIASES } from '../index/typeAliases.js';

export type FindElementsArgs = {
  query?: string;
  id?: string;
  name?: string;
  type?: string;
  processId?: string;
  limit: number;
};

export type FindResult = {
  query: string | null;
  matches: Array<ElementSummary & {
    incoming: number;
    outgoing: number;
    score: number;
  }>;
  truncated: boolean;
};

export function findElements(indexes: BpmnIndexes, args: FindElementsArgs): FindResult {
  const limit = Math.max(0, args.limit);
  const typeFilter = resolveTypeFilter(args.type);
  const query = args.id ?? args.name ?? args.query ?? null;
  const normalizedQuery = normalizeName(query);
  const candidates = [...indexes.byId.values()];
  const scored = new Map<string, FindResult['matches'][number]>();

  for (const candidate of candidates) {
    if (args.processId && candidate.processId !== args.processId) {
      continue;
    }
    if (typeFilter && !typeFilter.has(candidate.type)) {
      continue;
    }

    const score = scoreCandidate(candidate, {
      id: args.id,
      name: args.name,
      query: args.query,
      normalizedQuery,
      typeOnly: Boolean(typeFilter && !query)
    });
    if (score === 0) {
      continue;
    }

    scored.set(candidate.id, {
      ...candidate,
      incoming: indexes.incomingByNodeId.get(candidate.id)?.length ?? 0,
      outgoing: indexes.outgoingByNodeId.get(candidate.id)?.length ?? 0,
      score
    });
  }

  const matches = [...scored.values()].sort(compareMatches);
  return {
    query,
    matches: matches.slice(0, limit),
    truncated: matches.length > limit
  };
}

function resolveTypeFilter(type: string | undefined): Set<string> | null {
  if (!type) {
    return null;
  }

  if (type.startsWith('bpmn:')) {
    return new Set([type]);
  }

  const resolved = TYPE_ALIASES.get(type);
  if (!resolved) {
    throw new BpmnCliError('INVALID_TYPE_FILTER', 'Invalid type filter', 2, { type });
  }

  return new Set(resolved);
}

function scoreCandidate(
  candidate: ElementSummary,
  args: { id?: string; name?: string; query?: string; normalizedQuery: string; typeOnly: boolean }
): number {
  if (args.id) {
    return candidate.id === args.id ? 1 : 0;
  }

  const normalizedName = normalizeName(candidate.name);
  const query = args.name ?? args.query;
  if (!query && args.typeOnly) {
    return 0.5;
  }
  if (!query) {
    return 0;
  }

  const scores: number[] = [];
  if (candidate.id === query) {
    scores.push(1);
  }
  if (normalizedName && normalizedName === args.normalizedQuery) {
    scores.push(0.95);
  }
  if (normalizedName && normalizedName.includes(args.normalizedQuery)) {
    scores.push(0.8);
  }
  if (candidate.id.includes(query)) {
    scores.push(0.7);
  }

  return Math.max(0, ...scores);
}

function compareMatches(a: FindResult['matches'][number], b: FindResult['matches'][number]): number {
  return b.score - a.score
    || a.id.localeCompare(b.id)
    || a.type.localeCompare(b.type)
    || (a.name ?? '').localeCompare(b.name ?? '');
}
