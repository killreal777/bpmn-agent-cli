# Review Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `review` as a read-only JSON review packet command.

**Architecture:** Implement `src/query/review.ts` as a composition layer over overview, validate, participants, lanes, events, subprocess, and implementations. Expose through `src/cli/commands/reviewCommand.ts`.

**Tech Stack:** TypeScript, Vitest, existing query modules.

---

### Task 1: Query

**Files:**
- Create: `src/query/review.ts`
- Create: `test/query/review.test.ts`

- [ ] **Step 1: Write failing query test**

Use `test/fixtures/bpmn-lint.bpmn` and assert diagnostics, risk flags, and checklist are present.

- [ ] **Step 2: Run RED**

Run `npm test -- test/query/review.test.ts`.

- [ ] **Step 3: Implement query composition**

Build indexes once, call existing query modules, sort risk flags, and generate deterministic checklist entries.

### Task 2: CLI And Docs

**Files:**
- Create: `src/cli/commands/reviewCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`
- Modify docs and `test/docs.test.ts`

- [ ] **Step 1: Add CLI and docs tests**

Assert `review <file>` returns an envelope and docs mention `ReviewResult`.

- [ ] **Step 2: Implement command and docs**

Load BPMN, call `buildReviewPacket`, return success envelope.

### Task 3: Verification

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`, bundled smoke test, commit, and push.
