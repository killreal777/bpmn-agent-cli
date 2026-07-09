# Context Agent Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compact `context --profile agent` output and measure it on context benchmark tasks.

**Architecture:** Extend `src/query/context.ts` with an optional profile argument. Keep full context unchanged. Add compact path projection helpers for agent profile, and parse `--profile` in `src/cli/commands/contextCommand.ts`.

**Tech Stack:** TypeScript, Vitest, existing BPMN indexes and trace path traversal.

---

### Task 1: Query Profile

**Files:**
- Modify: `src/query/context.ts`
- Modify test: `test/query/context.test.ts`

- [ ] **Step 1: Write failing tests**

Assert default full context still returns path node objects, and `profile: "agent"` returns compact `nodeIds`, `flowIds`, and immediate incoming/outgoing summaries.

- [ ] **Step 2: Run query tests and verify RED**

Run: `npm test -- test/query/context.test.ts`.

- [ ] **Step 3: Implement compact profile**

Add compact path projection and typed result union.

- [ ] **Step 4: Run query tests and verify GREEN**

Run: `npm test -- test/query/context.test.ts`.

### Task 2: CLI And Docs

**Files:**
- Modify: `src/cli/commands/contextCommand.ts`
- Modify: `test/cli/cli.test.ts`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Add failing CLI/docs expectations**

Assert `context --profile agent` returns compact output and docs mention `AgentContextResult`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- test/cli/cli.test.ts -t "context agent profile"` and `npm test -- test/docs.test.ts`.

- [ ] **Step 3: Implement CLI parser and docs**

Accept `full` and `agent`; default to full.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- test/cli/cli.test.ts -t "context agent profile"` and `npm test -- test/docs.test.ts`.

### Task 3: Measurement

**Files:**
- Modify: context-related benchmark tasks under `benchmarks/tasks/`
- Add: `benchmarks/results/candidate-context-agent-profile.json`
- Add: `benchmarks/results/compare-context-agent-profile.json`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Update context benchmark tasks**

Add `--profile agent` to context CLI calls.

- [ ] **Step 2: Run benchmark and compare**

Run `npm run benchmark -- --variant candidate-context-agent-profile --output benchmarks/results/candidate-context-agent-profile.json` and compare against baseline.

- [ ] **Step 3: Document measured result**

Record success, CLI call, and token deltas.

### Task 4: Verification And Commit

- [ ] **Step 1: Run full verification**

Run `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`.

- [ ] **Step 2: Commit and push**

Commit message: `feat: add agent context profile`.

