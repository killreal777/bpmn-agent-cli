# P2-B Documentation Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe BPMN `documentation` editing with dry-run default and explicit `--write`.

**Architecture:** Implement constrained XML child documentation patching in `src/write/documentElement.ts`, validate through moddle before writes, then expose a JSON-envelope CLI command. Reuse safety patterns from `renameCommand`.

**Tech Stack:** TypeScript, Node.js, existing BPMN loader/indexes, Vitest.

---

## Task 1: Pure Documentation Patcher

**Files:**

- Create: `src/write/documentElement.ts`
- Create: `test/write/documentElement.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:

- add documentation to self-closing task XML
- replace first direct documentation child
- escape `&`, `<`, `>` in documentation text
- unknown id returns `ELEMENT_NOT_FOUND`

- [ ] **Step 2: RED**

```bash
npm test -- test/write/documentElement.test.ts
```

- [ ] **Step 3: Implement**

Create `documentElementXml(args)` returning `{ xml, result }`.

The result type mirrors `RenameResult` with `documentation` fields:

```ts
type DocumentationResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: { documentation: string | null };
  after: { documentation: string };
  diff: Array<{ op: "replace" | "add"; path: string; before: string | null; after: string }>;
};
```

- [ ] **Step 4: GREEN and commit**

```bash
npm test -- test/write/documentElement.test.ts
git add src/write/documentElement.ts test/write/documentElement.test.ts
git commit -m "feat: add documentation xml patcher"
```

## Task 2: Documentation CLI

**Files:**

- Create: `src/cli/commands/documentationCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: CLI RED tests**

Cover dry-run, `--write -o`, and dry-run with `-o` rejection.

- [ ] **Step 2: RED**

```bash
npm test -- test/cli/cli.test.ts
```

- [ ] **Step 3: Implement**

Follow `renameCommand` structure:

- require file, `--id`, `--text`
- reject `-o` without `--write`
- patch XML
- validate with `createBpmnModdle().fromXML`
- write only with `--write`
- return success envelope

- [ ] **Step 4: GREEN and commit**

```bash
npm test -- test/write/documentElement.test.ts test/cli/cli.test.ts
git add src/cli/commands/documentationCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add documentation cli command"
```

## Task 3: Docs And Skill

**Files:**

- Modify docs, README, skill, docs tests.

- [ ] **Step 1: Docs RED**

Expect `bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Review"` and `DocumentationResult`.

- [ ] **Step 2: Update docs and commit**

```bash
npm test -- test/docs.test.ts
git add docs README.md skills test/docs.test.ts
git commit -m "docs: document p2b documentation command"
```

## Task 4: Verification, Bundle, Push

- [ ] **Step 1: Full verification**

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

- [ ] **Step 2: Smoke**

```bash
node dist/cli/main.js documentation test/fixtures/simple-linear.bpmn --id Task_1 --text "Documents task" --pretty
```

- [ ] **Step 3: Commit bundle and push**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p2b"
git push origin main
```

