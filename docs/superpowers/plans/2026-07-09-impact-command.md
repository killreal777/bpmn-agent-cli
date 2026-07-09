# Impact Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `impact` as a read-only command that summarizes what is upstream/downstream and semantically attached to one element.

**Architecture:** Implement pure query composition in `src/query/impact.ts` using `collectPaths`, indexes, and `getCallActivities`; expose through `src/cli/commands/impactCommand.ts`; document output contract and CLI usage.

**Tech Stack:** TypeScript, Vitest, existing BPMN index/query modules.

---

### Task 1: Query

**Files:**
- Create: `src/query/impact.ts`
- Create: `test/query/impact.test.ts`

- [ ] **Step 1: Write failing query test**

Use `benchmarks/fixtures/subprocess-call-activity.bpmn` and assert impact for `CallActivity_RiskCheck`.

- [ ] **Step 2: Run RED**

Run `npm test -- test/query/impact.test.ts`.

- [ ] **Step 3: Implement query**

Collect backward and forward paths, lanes, participant, boundary events, implementations, related call activities, and affected id lists.

- [ ] **Step 4: Run GREEN**

Run `npm test -- test/query/impact.test.ts`.

### Task 2: CLI And Docs

**Files:**
- Create: `src/cli/commands/impactCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing CLI/docs tests**

Assert `impact <file> --id <id>` returns an envelope and docs mention `ImpactResult`.

- [ ] **Step 2: Implement CLI and docs**

Load BPMN, build indexes, call `getImpact`, and return the standard success envelope.

### Task 3: Verification

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`, bundled smoke test, commit, and push.
