# P2-A Rename Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe BPMN `rename` with dry-run default and explicit `--write`.

**Architecture:** Implement constrained XML name-attribute patching in `src/write/renameElement.ts`, validate through existing `loadBpmn`/indexes, then wire a JSON-envelope CLI command. No general XML parser and no writes without `--write`.

**Tech Stack:** TypeScript, Node.js `fs/promises`, existing BPMN loader/indexes, Vitest.

---

## Task 1: Pure Rename Patch

**Files:**

- Create: `src/write/renameElement.ts`
- Create: `test/write/renameElement.test.ts`

- [ ] **Step 1: Write failing tests**

Cover:

- replacing existing `name`
- adding missing `name`
- escaping `&`, `"`, `<`, `>`
- unknown id returns `BpmnCliError`
- unsupported element not in indexes returns `BpmnCliError`

Use `loadBpmn`, `buildIndexes`, and fixture XML read through `fs/promises`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/write/renameElement.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement**

`renameElementXml(args)` should accept:

```ts
type RenameElementArgs = {
  xml: string;
  indexes: BpmnIndexes;
  elementId: string;
  name: string;
  file: string;
};
```

Return:

```ts
type RenamePlan = {
  xml: string;
  result: RenameResult;
};
```

Use regex only to find the opening tag containing the exact escaped `id` attribute. Replace existing `name="..."` or add `name="..."` before closing `>` or `/>`.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/renameElement.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/write/renameElement.ts test/write/renameElement.test.ts
git commit -m "feat: add rename xml patcher"
```

## Task 2: Rename CLI

**Files:**

- Create: `src/cli/commands/renameCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write CLI RED tests**

Cover:

- dry-run returns `dryRun: true`, `written: false`
- dry-run does not modify input
- `--write -o tmp/renamed.bpmn` writes parseable XML
- dry-run with `-o` exits `2`

- [ ] **Step 2: Run RED**

```bash
npm test -- test/cli/cli.test.ts
```

- [ ] **Step 3: Implement command**

`renameCommand` must:

- require file, `--id`, `--name`
- reject `-o` without `--write`
- load model and indexes
- call `renameElementXml`
- validate patched XML by parsing through moddle or temporary loader helper
- write only when `--write`
- return success envelope

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/renameElement.test.ts test/cli/cli.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/renameCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add rename cli command"
```

## Task 3: Docs And Skill

**Files:**

- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `README.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Docs RED**

Add docs expectations for `bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review"` and `RenameResult`.

- [ ] **Step 2: Update docs**

Document dry-run default, `--write`, `-o`, safety rules, and P2-A roadmap.

- [ ] **Step 3: GREEN and commit**

```bash
npm test -- test/docs.test.ts
git add docs README.md skills test/docs.test.ts
git commit -m "docs: document p2a rename command"
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
node dist/cli/main.js rename test/fixtures/simple-linear.bpmn --id Task_1 --name "Review" --pretty
tmp_dir="$(mktemp -d)"
cp test/fixtures/simple-linear.bpmn "$tmp_dir/simple.bpmn"
node dist/cli/main.js rename "$tmp_dir/simple.bpmn" --id Task_1 --name "Review" --write -o "$tmp_dir/renamed.bpmn" --pretty
node dist/cli/main.js validate "$tmp_dir/renamed.bpmn"
```

- [ ] **Step 3: Commit bundle and push**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p2a"
git push origin main
```

