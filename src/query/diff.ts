import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type {
  BpmnIndexes,
  ElementSummary,
  ImplementationSummary,
  ModdleElement,
  SequenceFlowSummary
} from '../bpmn/types.js';

type RenamedElementChange = {
  before: ElementSummary;
  after: ElementSummary;
};

type ReconnectedFlowChange = {
  id: string;
  before: SequenceFlowSummary;
  after: SequenceFlowSummary;
};

type ImplementationChange = {
  element: ElementSummary;
  before: ImplementationSummary[];
  after: ImplementationSummary[];
};

type DocumentationChange = {
  element: ElementSummary;
  before: string | null;
  after: string | null;
};

type DiffChanges = {
  added: ElementSummary[];
  removed: ElementSummary[];
  renamed: RenamedElementChange[];
  reconnected: ReconnectedFlowChange[];
  implementationChanged: ImplementationChange[];
  documentationChanged: DocumentationChange[];
};

export type DiffResult = {
  baseFile: string;
  candidateFile: string;
  changes: DiffChanges;
  counts: Record<keyof DiffChanges, number>;
};

export function diffModels(args: {
  baseFile: string;
  candidateFile: string;
  base: BpmnIndexes;
  candidate: BpmnIndexes;
}): DiffResult {
  const changes: DiffChanges = {
    added: addedElements(args.base, args.candidate),
    removed: removedElements(args.base, args.candidate),
    renamed: renamedElements(args.base, args.candidate),
    reconnected: reconnectedFlows(args.base, args.candidate),
    implementationChanged: changedImplementations(args.base, args.candidate),
    documentationChanged: changedDocumentation(args.base, args.candidate)
  };

  return {
    baseFile: args.baseFile,
    candidateFile: args.candidateFile,
    changes,
    counts: Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [key, value.length])
    ) as Record<keyof DiffChanges, number>
  };
}

function addedElements(base: BpmnIndexes, candidate: BpmnIndexes): ElementSummary[] {
  return sortedElements([...candidate.byId.values()].filter((element) => !base.byId.has(element.id)));
}

function removedElements(base: BpmnIndexes, candidate: BpmnIndexes): ElementSummary[] {
  return sortedElements([...base.byId.values()].filter((element) => !candidate.byId.has(element.id)));
}

function renamedElements(base: BpmnIndexes, candidate: BpmnIndexes): RenamedElementChange[] {
  return commonElementIds(base, candidate)
    .map((id) => ({
      before: base.byId.get(id),
      after: candidate.byId.get(id)
    }))
    .filter((change): change is RenamedElementChange => Boolean(change.before && change.after))
    .filter((change) => change.before.name !== change.after.name)
    .sort((a, b) => a.before.id.localeCompare(b.before.id));
}

function reconnectedFlows(base: BpmnIndexes, candidate: BpmnIndexes): ReconnectedFlowChange[] {
  return [...base.sequenceFlowById.keys()]
    .filter((id) => candidate.sequenceFlowById.has(id))
    .map((id) => ({
      id,
      before: base.sequenceFlowById.get(id),
      after: candidate.sequenceFlowById.get(id)
    }))
    .filter((change): change is ReconnectedFlowChange => Boolean(change.before && change.after))
    .filter((change) => (
      change.before.sourceId !== change.after.sourceId
      || change.before.targetId !== change.after.targetId
      || change.before.condition !== change.after.condition
    ))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function changedImplementations(base: BpmnIndexes, candidate: BpmnIndexes): ImplementationChange[] {
  return commonElementIds(base, candidate)
    .map((id) => {
      const before = sortedImplementations(base.implementationsByElementId.get(id) ?? []);
      const after = sortedImplementations(candidate.implementationsByElementId.get(id) ?? []);

      return {
        element: candidate.byId.get(id) ?? base.byId.get(id),
        before,
        after
      };
    })
    .filter((change): change is ImplementationChange => Boolean(change.element))
    .filter((change) => canonicalJson(change.before) !== canonicalJson(change.after))
    .sort((a, b) => a.element.id.localeCompare(b.element.id));
}

function changedDocumentation(base: BpmnIndexes, candidate: BpmnIndexes): DocumentationChange[] {
  return commonElementIds(base, candidate)
    .map((id) => ({
      element: candidate.byId.get(id) ?? base.byId.get(id),
      before: documentationText(base.rawById.get(id)),
      after: documentationText(candidate.rawById.get(id))
    }))
    .filter((change): change is DocumentationChange => Boolean(change.element))
    .filter((change) => change.before !== change.after)
    .sort((a, b) => a.element.id.localeCompare(b.element.id));
}

function commonElementIds(base: BpmnIndexes, candidate: BpmnIndexes): string[] {
  return [...base.byId.keys()]
    .filter((id) => candidate.byId.has(id))
    .sort((a, b) => a.localeCompare(b));
}

function documentationText(element: ModdleElement | undefined): string | null {
  const values = arrayOf<ModdleElement>(element?.documentation)
    .map((documentation) => stringValue(documentation.text) ?? stringValue(documentation.body))
    .filter((value): value is string => Boolean(value));

  return values.length > 0 ? values.join('\n\n') : null;
}

function sortedElements(elements: ElementSummary[]): ElementSummary[] {
  return [...elements].sort((a, b) => a.id.localeCompare(b.id));
}

function sortedImplementations(implementations: ImplementationSummary[]): ImplementationSummary[] {
  return [...implementations].sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)));
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}
