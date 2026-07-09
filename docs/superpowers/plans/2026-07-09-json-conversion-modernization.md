# JSON Conversion Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition `to-json` as a first-class JSON conversion feature and move converter code out of `src/legacy`.

**Architecture:** Preserve the CLI command and output shape. Move implementation files from `src/legacy` to `src/convert`, update imports/tests, and update active docs from legacy/removal terminology to JSON conversion modernization.

**Tech Stack:** TypeScript, Vitest, Node CLI, bpmn-moddle converter pipeline.

---

### Task 1: Converter Module Rename

**Files:**
- Move: `src/legacy/**` to `src/convert/**`
- Move: `test/legacy/convert.test.ts` to `test/convert/convert.test.ts`
- Modify: `src/cli/commands/toJsonCommand.ts`
- Test: `test/convert/convert.test.ts`

- [ ] **Step 1: Add failing import/path expectations**

Use tests that import from `src/convert` and assert the old `src/legacy` directory is not part of active architecture.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- test/convert/convert.test.ts test/package.test.ts`

- [ ] **Step 3: Move files and update imports**

Move converter source and tests to conversion terminology.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- test/convert/convert.test.ts test/package.test.ts test/cli/cli.test.ts -t "to-json"`

### Task 2: Active Documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/PRODUCT_VISION.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Add failing doc expectations**

Expect `JSON Conversion Modernization`, `JsonConversionResult`, and no active “Legacy to-json Removal Plan”.

- [ ] **Step 2: Run docs test and verify RED**

Run: `npm test -- test/docs.test.ts`

- [ ] **Step 3: Update active docs**

Remove deprecated/removal framing; describe `to-json` as supported full JSON conversion.

- [ ] **Step 4: Run docs test and verify GREEN**

Run: `npm test -- test/docs.test.ts`

### Task 3: Bundle And Verification

**Files:**
- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Build extension bundle**

Run: `npm run build:extension`

- [ ] **Step 2: Smoke-test bundled `to-json`**

Run: `node dist/extension/bpmn-agent-cli.cjs to-json test/fixtures/simple-linear.bpmn --preset optimized`.

- [ ] **Step 3: Full verification**

Run: `npm test`, `npm run typecheck`, `npm run build`, `npm run build:extension`.

- [ ] **Step 4: Commit and push**

Commit message: `refactor: modernize json conversion module`.

