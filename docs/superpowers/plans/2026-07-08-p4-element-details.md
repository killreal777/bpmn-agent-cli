# P4 Element Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add measured, type-specific `element.details` output so agents can inspect important BPMN elements without raw XML or multiple follow-up commands.

**Architecture:** Extend indexes with an internal `rawById` moddle lookup, then keep extraction in a focused query helper that returns sanitized JSON-only details. Preserve existing `element` output fields and add `details` as an additive contract.

**Tech Stack:** TypeScript, `bpmn-moddle`, Camunda moddle descriptors, Vitest, existing benchmark runner.

---

### Task 1: Query Contract And Extraction

**Files:**
- Modify: `src/bpmn/types.ts`
- Modify: `src/index/buildIndexes.ts`
- Create: `src/query/elementDetails.ts`
- Modify: `src/query/element.ts`
- Test: `test/query/element.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for `bpmn:CallActivity`, `bpmn:ServiceTask`, `bpmn:UserTask`, `bpmn:SequenceFlow`, and `bpmn:BoundaryEvent` details.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- test/query/element.test.ts`.

- [ ] **Step 3: Add internal raw moddle index**

Add `rawById: Map<string, ModdleElement>` to `BpmnIndexes` and populate it while indexing flow elements.

- [ ] **Step 4: Implement sanitized details extraction**

Return only stable JSON fields: call activity called element and mappings, runtime implementation attrs, form key, sequence-flow condition/variable candidates, boundary event definition and attached element.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- test/query/element.test.ts`.

### Task 2: CLI Contract Documentation

**Files:**
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/CLI.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Assert that docs mention `ElementDetails`, `CallActivityElementDetails`, and `callActivityMappings`.

- [ ] **Step 2: Update docs**

Document `element.details` as an additive field and explain supported P4 details.

- [ ] **Step 3: Run docs test**

Run: `npm test -- test/docs.test.ts`.

### Task 3: Measured Candidate Benchmark

**Files:**
- Create: `benchmarks/results/candidate-element-details.json`
- Create: `benchmarks/results/compare-element-details.json`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Run candidate benchmark**

Run: `npm run benchmark -- --variant candidate-element-details --output benchmarks/results/candidate-element-details.json`.

- [ ] **Step 2: Compare with baseline**

Run: `npm run benchmark:compare -- --baseline benchmarks/results/baseline.json --candidate benchmarks/results/candidate-element-details.json --output benchmarks/results/compare-element-details.json`.

- [ ] **Step 3: Record decision**

Update roadmap/backlog with measured result and mark `element.details` implemented.

### Task 4: Verification And Bundle

**Files:**
- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Full verification**

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension`.

- [ ] **Step 2: Commit and push**

Commit feature, benchmark decision, and bundle update to `main`.
