import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary } from '../bpmn/types.js';

const CAMUNDA_NS = 'http://camunda.org/schema/1.0/bpmn';

export type SupportedImplementationPatchKind =
  | 'delegateExpression'
  | 'class'
  | 'expression'
  | 'externalTask'
  | 'form'
  | 'callActivity';

export type ImplementationPatchResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  kind: SupportedImplementationPatchKind;
  before: Record<string, string | null>;
  after: Record<string, string>;
  diff: Array<{
    op: 'replace' | 'add';
    path: string;
    before: string | null;
    after: string;
  }>;
};

export type SetImplementationArgs = {
  xml: string;
  indexes: BpmnIndexes;
  elementId: string;
  kind: string;
  value: string;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type ImplementationPatchPlan = {
  xml: string;
  result: ImplementationPatchResult;
};

type AttributePatch = {
  name: string;
  value: string;
};

export function setImplementationXml(args: SetImplementationArgs): ImplementationPatchPlan {
  const element = args.indexes.byId.get(args.elementId);
  if (!element) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
  }

  const kind = parseKind(args.kind);
  const patches = patchesFor(kind, args.value);
  const patched = patchOpeningTag(args.xml, args.elementId, patches);
  const xml = patches.some((patch) => patch.name.startsWith('camunda:'))
    ? ensureCamundaNamespace(patched.xml)
    : patched.xml;

  return {
    xml,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      element,
      kind,
      before: patched.before,
      after: Object.fromEntries(patches.map((patch) => [patch.name, patch.value])),
      diff: patched.diff.map((item) => ({
        ...item,
        path: `/elements/${args.elementId}/${item.path}`
      }))
    }
  };
}

function parseKind(kind: string): SupportedImplementationPatchKind {
  if (
    kind === 'delegateExpression'
    || kind === 'class'
    || kind === 'expression'
    || kind === 'externalTask'
    || kind === 'form'
    || kind === 'callActivity'
  ) {
    return kind;
  }

  throw new BpmnCliError('INVALID_OPTION_VALUE', `Unsupported implementation kind: ${kind}`, 2, { kind });
}

function patchesFor(kind: SupportedImplementationPatchKind, value: string): AttributePatch[] {
  if (kind === 'delegateExpression') {
    return [{ name: 'camunda:delegateExpression', value }];
  }

  if (kind === 'class') {
    return [{ name: 'camunda:class', value }];
  }

  if (kind === 'expression') {
    return [{ name: 'camunda:expression', value }];
  }

  if (kind === 'externalTask') {
    return [
      { name: 'camunda:type', value: 'external' },
      { name: 'camunda:topic', value }
    ];
  }

  if (kind === 'form') {
    return [{ name: 'camunda:formKey', value }];
  }

  return [{ name: 'calledElement', value }];
}

function patchOpeningTag(
  xml: string,
  elementId: string,
  patches: AttributePatch[]
): {
  xml: string;
  before: Record<string, string | null>;
  diff: Array<{ op: 'replace' | 'add'; path: string; before: string | null; after: string }>;
} {
  const escapedId = escapeRegExp(elementId);
  const tagPattern = new RegExp(`<[^!?/][^>]*\\bid="${escapedId}"[^>]*>`);
  const match = xml.match(tagPattern);
  if (!match || match.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find target element opening tag', 1, { elementId });
  }

  let tag = match[0];
  const before: Record<string, string | null> = {};
  const diff: Array<{ op: 'replace' | 'add'; path: string; before: string | null; after: string }> = [];

  for (const patch of patches) {
    const existing = readAttribute(tag, patch.name);
    before[patch.name] = existing;
    tag = writeAttribute(tag, patch.name, patch.value);
    diff.push({
      op: existing === null ? 'add' : 'replace',
      path: patch.name,
      before: existing,
      after: patch.value
    });
  }

  return {
    xml: `${xml.slice(0, match.index)}${tag}${xml.slice(match.index + match[0].length)}`,
    before,
    diff
  };
}

function readAttribute(tag: string, name: string): string | null {
  const pattern = new RegExp(`\\s${escapeRegExp(name)}="([^"]*)"`);
  return tag.match(pattern)?.[1] ?? null;
}

function writeAttribute(tag: string, name: string, value: string): string {
  const escapedValue = escapeAttribute(value);
  const pattern = new RegExp(`\\s${escapeRegExp(name)}="[^"]*"`);
  if (pattern.test(tag)) {
    return tag.replace(pattern, ` ${name}="${escapedValue}"`);
  }

  return tag.replace(/\/?>$/, (suffix) => ` ${name}="${escapedValue}"${suffix}`);
}

function ensureCamundaNamespace(xml: string): string {
  if (xml.includes('xmlns:camunda=')) {
    return xml;
  }

  const definitionsPattern = /<bpmn:definitions\b[^>]*>/;
  const match = xml.match(definitionsPattern);
  if (!match || match.index === undefined) {
    throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Could not find bpmn:definitions opening tag', 1);
  }

  const tag = match[0].replace(/>$/, ` xmlns:camunda="${CAMUNDA_NS}">`);
  return `${xml.slice(0, match.index)}${tag}${xml.slice(match.index + match[0].length)}`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
