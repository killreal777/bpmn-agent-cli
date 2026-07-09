# P4 Call Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the read-only `call-activity` command for compact CallActivity contract inspection.

**Architecture:** Add a pure query in `src/query/callActivity.ts`, a thin CLI command in `src/cli/commands/callActivityCommand.ts`, route it from `src/cli/main.ts`, and document the JSON contract. Reuse existing CallActivity mapping extraction from `src/query/elementDetails.ts` and variable summarization behavior from `src/query/variables.ts`.

**Tech Stack:** TypeScript, bpmn-moddle model indexes, Vitest, Node CLI.

---

### Task 1: Query Behavior

**Files:**
- Create: `src/query/callActivity.ts`
- Test: `test/query/callActivity.test.ts`

- [ ] **Step 1: Write failing query tests**

Cover all-call-activity listing, filtering by id, and non-CallActivity rejection.

- [ ] **Step 2: Run query tests and verify RED**

Run: `npm test -- test/query/callActivity.test.ts`

- [ ] **Step 3: Implement query**

Use `indexes.byType.get('bpmn:CallActivity')`, `getElementDetails`, and `variableCandidatesFromMappings`.

- [ ] **Step 4: Run query tests and verify GREEN**

Run: `npm test -- test/query/callActivity.test.ts`

### Task 2: CLI Wiring

**Files:**
- Create: `src/cli/commands/callActivityCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Add failing CLI test**

Assert that `bpmn-agent-cli call-activity <file> --id CallActivity_RiskCheck` returns the standard envelope.

- [ ] **Step 2: Run CLI test and verify RED**

Run: `npm test -- test/cli/cli.test.ts -t "call-activity"`

- [ ] **Step 3: Implement command wrapper and route**

Validate file presence and optional `--id`, then call the pure query.

- [ ] **Step 4: Run CLI test and verify GREEN**

Run: `npm test -- test/cli/cli.test.ts -t "call-activity"`

### Task 3: Docs And Backlog

**Files:**
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `README.md`
- Test: `test/docs.test.ts`

- [ ] **Step 1: Add failing doc expectations**

Assert docs mention `call-activity`, `CallActivityResult`, and the README example.

- [ ] **Step 2: Run docs test and verify RED**

Run: `npm test -- test/docs.test.ts`

- [ ] **Step 3: Update docs and backlog status**

Mark BL-012 implemented and document the result schema.

- [ ] **Step 4: Run docs test and verify GREEN**

Run: `npm test -- test/docs.test.ts`

### Task 4: Verification And Commit

**Files:**
- All files above

- [ ] **Step 1: Run focused tests**

Run: `npm test -- test/query/callActivity.test.ts test/cli/cli.test.ts test/docs.test.ts`

- [ ] **Step 2: Run full verification**

Run: `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`.

- [ ] **Step 3: Commit and push**

Commit message: `feat: add call activity read command`

