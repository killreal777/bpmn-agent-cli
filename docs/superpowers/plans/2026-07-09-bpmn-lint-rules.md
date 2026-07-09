# BPMN Lint Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add warnings-only BPMN lint diagnostics to `validate`.

**Architecture:** Keep parse/reference validation in `src/validate/validateModel.ts`, add semantic lint rules in a focused `src/validate/bpmnLint.ts`, then merge warnings into the existing `ValidateResult`.

**Tech Stack:** TypeScript, Vitest, existing `BpmnIndexes`, `bpmn-moddle`.

---

### Task 1: Lint Rule Tests

**Files:**
- Create: `test/fixtures/bpmn-lint.bpmn`
- Modify: `test/validate/validateModel.test.ts`

- [ ] **Step 1: Write failing fixture and test**

Create one BPMN fixture that contains missing service implementation, external task without topic, gateway branch without condition, dead-end task, unreachable task, duplicate names, boundary event without outgoing handler, and call activity without called element.

- [ ] **Step 2: Run test and verify RED**

Run `npm test -- test/validate/validateModel.test.ts -t "BPMN lint"`.

### Task 2: Lint Implementation

**Files:**
- Create: `src/validate/bpmnLint.ts`
- Modify: `src/validate/validateModel.ts`

- [ ] **Step 1: Implement lint diagnostics**

Use existing indexes and raw moddle elements. Return sorted warning diagnostics only.

- [ ] **Step 2: Run focused validation tests and verify GREEN**

Run `npm test -- test/validate/validateModel.test.ts`.

### Task 3: Docs And Verification

**Files:**
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Document rule codes**

Add the P4 lint warning codes to output contracts and mark BL-017 implemented.

- [ ] **Step 2: Run full verification**

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension`, then commit and push.
