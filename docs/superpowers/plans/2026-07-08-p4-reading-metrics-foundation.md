# P4 Reading Metrics Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sprint 0 measurement foundation for BPMN reading optimization: benchmark assets, opt-in CLI metrics logging, benchmark runner, comparison report, and first baseline result.

**Architecture:** Keep runtime metrics small and local to CLI wiring, with no impact unless `--trace-metrics` is passed. Keep benchmark execution outside the CLI under `scripts/` and `benchmarks/`, so analysis commands stay deterministic and network-free.

**Tech Stack:** TypeScript CLI, Node.js scripts, Vitest, synthetic BPMN fixtures, JSON benchmark task definitions, JSON/JSONL reports.

---

### Task 1: Benchmark Assets

**Files:**
- Create: `benchmarks/fixtures/*.bpmn`
- Create: `benchmarks/tasks/*.json`
- Create: `benchmarks/results/.gitkeep`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write the failing docs/asset test**

Add assertions that `benchmarks/tasks` and `docs/READING_METRICS_STRATEGY.md` exist and contain required benchmark concepts.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/docs.test.ts`

- [ ] **Step 3: Add benchmark fixtures and task definitions**

Create at least 5 synthetic BPMN fixtures and 20 task definitions covering overview, lookup, context, gateway, path, events, subprocess/call activity, implementations, variables, and composite reading tasks.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/docs.test.ts`

### Task 2: CLI Metrics Logging

**Files:**
- Create: `src/metrics/traceMetrics.ts`
- Modify: `src/cli/main.ts`
- Test: `test/metrics/traceMetrics.test.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing unit tests**

Test that metrics entries hash file content and args, estimate output tokens, omit BPMN content, and append JSONL.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- test/metrics/traceMetrics.test.ts`

- [ ] **Step 3: Implement metrics helper**

Add a focused helper that builds and appends trace entries with command, file hash, args hash, duration, exit code, stdout bytes, estimated output tokens, and error code.

- [ ] **Step 4: Add CLI integration test**

Test `--trace-metrics` with `overview` and verify stdout remains JSON while the metrics file receives one JSONL entry.

- [ ] **Step 5: Implement CLI integration**

Count stdout bytes during command execution, append metrics after success or handled error, and keep metrics disabled unless explicitly requested.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- test/metrics/traceMetrics.test.ts test/cli/cli.test.ts`

### Task 3: Benchmark Runner And Compare

**Files:**
- Create: `scripts/benchmark.mjs`
- Create: `scripts/benchmark-compare.mjs`
- Modify: `package.json`
- Test: `test/benchmark/benchmarkScripts.test.ts`

- [ ] **Step 1: Write failing script tests**

Test that benchmark scripts are present in `package.json`, can run a tiny task subset, and produce JSON reports with aggregate metrics.

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- test/benchmark/benchmarkScripts.test.ts`

- [ ] **Step 3: Implement runner script**

Read benchmark task JSON, execute configured CLI calls, collect elapsed time, stdout bytes, estimated output tokens, success flags, and write `benchmarks/results/<variant>.json`.

- [ ] **Step 4: Implement compare script**

Read two reports, compute aggregate deltas, and write or print stable JSON comparison.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- test/benchmark/benchmarkScripts.test.ts`

### Task 4: Baseline Report And Verification

**Files:**
- Create: `benchmarks/results/baseline.json`
- Modify: `docs/BACKLOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Run baseline benchmark**

Run: `npm run benchmark -- --variant baseline`

- [ ] **Step 2: Update docs status**

Mark benchmark fixtures/tasks, metrics logging, runner, and baseline report as implemented.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

- [ ] **Step 4: Commit and push**

Commit the Sprint 0 implementation and push `main`.
