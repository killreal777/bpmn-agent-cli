# P4 Variables Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `variables` command that lets agents inspect variable usage and CallActivity data mappings without reading raw BPMN XML.

**Architecture:** Reuse sanitized `element.details` extraction where possible, add a dedicated `src/query/variables.ts` aggregation layer, then expose it through CLI and output contracts. Treat expression parsing as best-effort candidate extraction, not semantic code analysis.

**Tech Stack:** TypeScript, existing `bpmn-moddle` indexes, Vitest, existing benchmark runner.

---

### Task 1: Query Extraction

**Files:**
- Create: `src/query/variables.ts`
- Modify: `src/query/elementDetails.ts`
- Test: `test/query/variables.test.ts`

- [ ] **Step 1: Write failing query tests**

Cover CallActivity `camunda:in/out`, `variables="all"`, sequence-flow condition variables, `--element` filtering, and `--name` filtering.

- [ ] **Step 2: Run tests to verify failure**

Run `npm test -- test/query/variables.test.ts`.

- [ ] **Step 3: Implement aggregation**

Return sorted `variables`, `usages`, `callActivityMappings`, and `warnings`. Use directions `read`, `write`, `in`, `out`, `pass-through`, and `unknown`.

- [ ] **Step 4: Run focused tests**

Run `npm test -- test/query/variables.test.ts`.

### Task 2: CLI And Contracts

**Files:**
- Create: `src/cli/commands/variablesCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Test: `test/cli/cli.test.ts`
- Test: `test/docs.test.ts`

- [ ] **Step 1: Write failing CLI/docs tests**

Assert `bpmn-agent-cli variables process.bpmn`, `--element`, and `--name` return JSON envelopes and docs include `VariablesResult`.

- [ ] **Step 2: Implement command wiring**

Load BPMN, build indexes, call `getVariables`, return success envelope.

- [ ] **Step 3: Update docs/contracts**

Document command examples, filters, and result schema.

- [ ] **Step 4: Run focused tests**

Run `npm test -- test/query/variables.test.ts test/cli/cli.test.ts test/docs.test.ts`.

### Task 3: Benchmark Experiment

**Files:**
- Modify: `benchmarks/tasks/T9-variables-call-activity.json`
- Modify: `benchmarks/tasks/T9-variables-gateway-conditions.json`
- Create: `benchmarks/results/candidate-variables.json`
- Create: `benchmarks/results/compare-variables.json`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Update variable benchmark tasks**

Switch T9 tasks to use `variables` instead of indirect command combinations where appropriate.

- [ ] **Step 2: Run benchmark and compare**

Run candidate benchmark and compare against baseline.

- [ ] **Step 3: Record decision**

Mark `variables` implemented and document metric result.

### Task 4: Verification And Bundle

**Files:**
- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Full verification**

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension`.

- [ ] **Step 2: Commit and push**

Commit implementation, benchmark decision, and bundle update to `main`.
