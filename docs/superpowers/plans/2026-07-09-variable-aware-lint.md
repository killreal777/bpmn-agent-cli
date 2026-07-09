# Variable-Aware Lint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add warnings-only variable-aware lint diagnostics to `validate`.

**Architecture:** Implement `src/validate/variableLint.ts` as a pure helper over existing indexes and variable/call-activity query functions. Append its diagnostics from `validateModel` without changing the existing `valid` calculation.

**Tech Stack:** TypeScript, Vitest, bpmn-moddle indexes.

---

### Task 1: Variable Lint Helper

**Files:**
- Create: `src/validate/variableLint.ts`
- Modify: `src/validate/validateModel.ts`
- Create fixture: `test/fixtures/variable-lint.bpmn`
- Modify test: `test/validate/validateModel.test.ts`

- [ ] **Step 1: Write failing tests**

Add a test that validates `test/fixtures/variable-lint.bpmn` and expects warnings for missing mappings, missing targets, pass-through, and condition reads without a producer.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- test/validate/validateModel.test.ts`.

- [ ] **Step 3: Implement helper**

Use `getCallActivities` for CallActivity contracts and `getVariables` for condition reads and output producers.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- test/validate/validateModel.test.ts`.

### Task 2: CLI And Docs

**Files:**
- Modify: `test/cli/cli.test.ts`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Add failing CLI/docs expectations**

Assert CLI `validate` returns the new warning codes and docs mention variable-aware lint.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- test/cli/cli.test.ts -t "variable-aware lint"` and `npm test -- test/docs.test.ts`.

- [ ] **Step 3: Update docs**

Document warning-only behavior and mark BL-013 implemented.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- test/cli/cli.test.ts -t "variable-aware lint"` and `npm test -- test/docs.test.ts`.

### Task 3: Verification And Commit

**Files:**
- All files above

- [ ] **Step 1: Run full verification**

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`.

- [ ] **Step 2: Commit and push**

Commit message: `feat: add variable-aware validate lint`.

