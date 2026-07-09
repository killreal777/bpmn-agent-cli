# Diff Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `diff` as a read-only semantic BPMN comparison command.

**Architecture:** Implement pure comparison in `src/query/diff.ts`, thin CLI wrapper in `src/cli/commands/diffCommand.ts`, and route from `src/cli/main.ts`. Use existing indexes and raw moddle elements only for documentation extraction.

**Tech Stack:** TypeScript, Vitest, bpmn-moddle indexes.

---

### Task 1: Query

**Files:**
- Create: `src/query/diff.ts`
- Create fixtures: `test/fixtures/diff-base.bpmn`, `test/fixtures/diff-candidate.bpmn`
- Create test: `test/query/diff.test.ts`

- [ ] **Step 1: Write failing tests**

Assert added, removed, renamed, reconnected, implementation-changed, and documentation-changed changes.

- [ ] **Step 2: Run query test and verify RED**

Run `npm test -- test/query/diff.test.ts`.

- [ ] **Step 3: Implement query**

Compare `BpmnIndexes` by id and stable JSON summaries.

- [ ] **Step 4: Run query test and verify GREEN**

Run `npm test -- test/query/diff.test.ts`.

### Task 2: CLI And Docs

**Files:**
- Create: `src/cli/commands/diffCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Add failing CLI/docs tests**

Assert `diff --base --candidate` envelope and docs mention `DiffResult`.

- [ ] **Step 2: Run focused tests and verify RED**

Run `npm test -- test/cli/cli.test.ts -t "diff envelope"` and `npm test -- test/docs.test.ts`.

- [ ] **Step 3: Implement CLI/docs**

Load both BPMN files, build indexes, return success envelope.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run focused tests again.

### Task 3: Verification

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`, then commit and push.

