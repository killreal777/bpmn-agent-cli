# P1-B Path Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the read-only `path` command for deterministic sequence-flow paths between two BPMN elements.

**Architecture:** Implement pure bounded traversal in `src/query/path.ts`, wire it through `src/cli/commands/pathCommand.ts` and `src/cli/main.ts`, then document `PathResult`. Reuse existing `BpmnIndexes` and `PathSummary`; do not add indexes unless verification exposes a gap.

**Tech Stack:** TypeScript, Node.js, Vitest, tsx, existing `bpmn-moddle` indexing, esbuild extension bundle.

---

## Task 1: Path Query

**Files:**

- Create: `test/query/path.test.ts`
- Create: `src/query/path.ts`

- [ ] **Step 1: Write failing query tests**

Create `test/query/path.test.ts` with tests for:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { findPaths } from '../../src/query/path.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('findPaths', () => {
  it('finds a forward path between two elements', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'StartEvent_1',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 10,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths[0].nodes.map((node) => node.id)).toEqual(['StartEvent_1', 'Task_1', 'EndEvent_1']);
    expect(result.paths[0].depth).toBe(2);
  });

  it('finds a backward path while preserving endpoint order', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'EndEvent_1',
      to: 'StartEvent_1',
      direction: 'backward',
      depth: 10,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths[0].nodes.map((node) => node.id)).toEqual(['EndEvent_1', 'Task_1', 'StartEvent_1']);
  });

  it('returns no paths when target is unreachable within depth', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'StartEvent_1',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 1,
      maxPaths: 20
    });

    expect(result.found).toBe(false);
    expect(result.paths).toEqual([]);
    expect(result.truncated).toBe(true);
  });

  it('is cycle-safe', async () => {
    const model = await loadBpmn(fixturePath('cycle.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'Task_A',
      to: 'Task_A',
      direction: 'forward',
      depth: 5,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths.some((path) => path.cycleDetected)).toBe(true);
  });

  it('rejects unknown endpoints', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => findPaths(buildIndexes(model), {
      from: 'Missing',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 10,
      maxPaths: 20
    })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run query tests to verify failure**

Run:

```bash
npm test -- test/query/path.test.ts
```

Expected: FAIL because `src/query/path.ts` does not exist.

- [ ] **Step 3: Implement path query**

Create `src/query/path.ts`:

```ts
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
```

Implement `findPaths(indexes, args)` as breadth-first queue traversal:

```ts
export function findPaths(indexes: BpmnIndexes, args: PathArgs): PathResult {
  const from = indexes.byId.get(args.from);
  const to = indexes.byId.get(args.to);
  if (!from) throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.from });
  if (!to) throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.to });

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
```

Queue item shape:

```ts
type QueueItem = {
  nodes: ElementSummary[];
  flows: PathSummary['flows'];
  seen: Set<string>;
  cycleDetected?: boolean;
};
```

Rules:

- Initialize queue with `{ nodes: [from], flows: [], seen: new Set([from.id]) }`.
- For each queue item, if current node is target and `flows.length > 0`, add path.
- If `flows.length >= depth`, mark `truncated = true` when current is not target and stop expanding.
- Expand outgoing flows for forward, incoming flows for backward, sorted by flow id.
- On repeated node, enqueue the repeated node once with `cycleDetected: true`; do not expand items where `cycleDetected` is true.
- Stop adding paths when `paths.length >= maxPaths`; set `truncated = true`.

- [ ] **Step 4: Run query tests to verify pass**

Run:

```bash
npm test -- test/query/path.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit query**

```bash
git add src/query/path.ts test/query/path.test.ts
git commit -m "feat: add path query"
```

## Task 2: Path CLI

**Files:**

- Create: `src/cli/commands/pathCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests to `test/cli/cli.test.ts`:

```ts
  it('prints path envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'path', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1', '--to', 'EndEvent_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'path',
      result: {
        found: true,
        paths: [expect.objectContaining({ depth: 2 })]
      }
    });
  });

  it('exits 2 when path is missing --to', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'path', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });
```

- [ ] **Step 2: Run CLI tests to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `path` is an unknown command.

- [ ] **Step 3: Implement command wrapper and route**

Create `src/cli/commands/pathCommand.ts`:

```ts
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { findPaths } from '../../query/path.js';
import type { ParsedArgs } from '../args.js';
```

The command must:

- require file
- require string `--from`
- require string `--to`
- accept `--direction forward|backward`, default `forward`
- parse `--depth`, default `10`
- parse `--max-paths`, default `20`
- return success envelope with `command: 'path'`

Modify `src/cli/main.ts` to import and route `pathCommand`.

- [ ] **Step 4: Run CLI checks**

Run:

```bash
npm test -- test/query/path.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit CLI**

```bash
git add src/cli/commands/pathCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add path cli command"
```

## Task 3: Docs And Skill

**Files:**

- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `README.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Add expectations:

```ts
expect(cli).toContain('bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1');
expect(contracts).toContain('PathResult');
expect(readme).toContain('bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1');
```

- [ ] **Step 2: Run docs test to verify failure**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL because path docs are missing.

- [ ] **Step 3: Update docs**

Add path examples and `PathResult` schema. Mark `path` as P1-B implemented in roadmap. Add skill workflow entry:

```md
14. Use `bpmn-agent-cli path <file> --from <sourceId> --to <targetId>` to answer reachability questions.
```

- [ ] **Step 4: Run docs test**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit docs**

```bash
git add docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md README.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p1b path command"
```

## Task 4: Verification, Bundle, And Push

**Files:**

- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

Expected: all exit `0`.

- [ ] **Step 2: Run smoke tests**

Run:

```bash
node dist/cli/main.js path test/fixtures/simple-linear.bpmn --from StartEvent_1 --to EndEvent_1 --pretty
tmp_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$tmp_dir/bpmn-agent-cli.cjs"
cp test/fixtures/simple-linear.bpmn "$tmp_dir/simple-linear.bpmn"
node "$tmp_dir/bpmn-agent-cli.cjs" path "$tmp_dir/simple-linear.bpmn" --from StartEvent_1 --to EndEvent_1 --pretty
```

Expected: both print JSON envelopes with `ok: true` and `found: true`.

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p1b"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

