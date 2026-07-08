# BPMN Agent CLI: Reading Optimization Metrics Strategy

Date: 2026-07-08
Status: Draft for implementation planning
Owner: Product / Engineering
Target repository: `bpmn-agent-cli`

## 1. Purpose

This document defines a product-driven, metrics-based approach for improving BPMN reading capabilities in `bpmn-agent-cli`.

The project must not add reading features only because they look useful. Each new reading improvement should be treated as a product hypothesis and evaluated against measurable outcomes: token usage, agent efficiency, task success, and correctness.

The current product direction is:

> Improve the ability of coding agents to read BPMN files efficiently, with minimal token cost and minimal need to inspect raw BPMN XML.

This document is intended for a coding agent, such as Codex CLI, that will implement the evaluation infrastructure, benchmark tasks, measurement process, and later feature experiments.

## 2. Business Goal

The business value of the tool is not “more CLI commands”. The business value is:

> Reduce the cost and time of agent-assisted development involving BPMN files.

The expected value comes from:

- fewer input/output tokens per successful task;
- fewer agent steps and tool calls;
- less direct reading of full BPMN XML;
- faster context acquisition;
- fewer BPMN interpretation mistakes;
- less manual correction by the developer.

The immediate product focus is **reading optimization**.

Writing, validation, linting, review, and CI workflows are important, but they are not the primary focus of the next product iteration. Reading is considered a prerequisite for safe and useful agent-driven BPMN work.

## 3. Product Problem

Coding agents struggle with BPMN because BPMN XML is large, noisy, and not organized around the questions agents actually ask.

A BPMN file contains:

- process structure;
- sequence flows;
- gateways;
- events;
- subprocesses;
- participants and lanes;
- Camunda implementation metadata;
- extension elements;
- diagram layout data;
- technical XML details.

The agent usually does not need the full file. It needs precise answers to questions such as:

- What does this task do?
- What happens before and after this task?
- Which branches can be taken after this gateway?
- Which delegates or external task topics can be executed for this product type?
- Which boundary events can interrupt this activity?
- Which subprocess or call activity is invoked?
- Which variables are read by conditions and mappings?
- Can this process path reach a specific task or end event?
- What context does the agent need before changing this BPMN or related backend code?

Therefore, the product should optimize for **question-oriented BPMN reading**, not raw XML access.

## 4. Primary User Stories

### Developer story

As a developer,
I want my coding agent to read BPMN files efficiently,
so that it can understand the process context and help me work with BPMN-related code without wasting tokens or requiring manual XML inspection.

### Agent story

As a coding agent,
I want to ask focused questions about a BPMN file and receive compact, structured answers,
so that I can understand the process, locate relevant elements, reason about branches and runtime integrations, and complete development tasks with minimal token usage.

## 5. Product Principle

The project must use a metric-first product loop:

1. Define a reading problem.
2. Formulate a hypothesis.
3. Add benchmark tasks that represent the problem.
4. Measure the baseline using the current tool.
5. Implement the smallest candidate improvement.
6. Run the same benchmark against the candidate version.
7. Compare metrics.
8. Accept, keep, revise, or postpone the feature based on evidence.

Do not implement large groups of reading features without measurement.

## 6. Metrics

The project should collect four groups of metrics.

### 6.1 Cost metrics

These measure token and model-cost efficiency.

- `tokens_per_task`
- `tokens_per_successful_task`
- `input_tokens_per_task`
- `output_tokens_per_task`
- `cli_output_tokens_per_task`
- `model_calls_per_task`
- `cli_calls_per_task`

Primary cost metric:

```text
tokens_per_successful_task
```

This is more important than raw token count because a cheaper failed answer is not useful.

### 6.2 Speed metrics

These measure how quickly the agent reaches a useful answer.

- `time_to_answer_ms`
- `time_to_correct_answer_ms`
- `agent_steps_count`
- `cli_calls_count`
- `retry_count`

Primary speed metric:

```text
time_to_correct_answer_ms
```

### 6.3 Quality metrics

These measure whether the result is actually correct and useful.

- `task_success_rate`
- `answer_correctness_score`
- `missing_context_errors`
- `wrong_bpmn_interpretation_errors`
- `manual_correction_needed`

For the first implementation, correctness may be scored with a simple rubric:

```text
0 — incorrect answer
1 — partially correct, significant manual work needed
2 — mostly correct, minor omissions
3 — correct and sufficient for the task
```

Primary quality metric:

```text
answer_correctness_score
```

### 6.4 Agent efficiency metrics

These measure whether the tool actually helps the agent avoid inefficient behavior.

- `xml_fallback_rate`
- `full_file_read_rate`
- `irrelevant_cli_output_rate`
- `command_confusion_rate`
- `tool_error_rate`

Important definitions:

- `xml_fallback_rate`: how often the agent had to inspect raw `.bpmn` XML directly.
- `full_file_read_rate`: how often the agent read the whole BPMN file or full converted JSON instead of using targeted commands.
- `command_confusion_rate`: how often the agent chose an irrelevant command or had to retry with a different command.
- `irrelevant_cli_output_rate`: estimated share of CLI output that was not needed to answer the task.

## 7. Acceptance Philosophy

Feature acceptance should be pragmatic and not overly strict.

A feature does not need to save 20% tokens to be useful. If a feature reliably saves 5–10% tokens without hurting correctness, speed, or usability, it can still be valuable.

Recommended decision rules:

### Strong accept

Accept the feature as a clear product improvement if:

- `tokens_per_successful_task` improves by at least 15%; or
- `task_success_rate` improves meaningfully; or
- `answer_correctness_score` improves meaningfully; or
- `xml_fallback_rate` drops significantly;
- and no major regression appears in correctness, speed, or reliability.

### Soft accept

Accept or keep the feature if:

- token usage improves by 5–15%; and
- correctness does not regress; and
- the feature is simple to maintain; and
- the feature is useful in at least one important reading use case.

This category is important. Small token savings are still valuable if the feature is stable, understandable, and cheap to maintain.

### Revise

Revise the feature if:

- it improves one metric but worsens another important metric;
- output is too verbose;
- agents misuse the command;
- the feature is promising but the interface is unclear.

### Postpone or reject

Postpone or reject the feature if:

- it does not improve measured outcomes;
- it increases token usage without improving correctness;
- it causes command confusion;
- it is expensive to maintain;
- it duplicates an existing command without clear benefit.

## 8. Evaluation Approach

The project should not depend on hundreds of developers for validation.

Use a hybrid evaluation model:

1. **Offline agent benchmark** as the primary mechanism.
2. **Small human review** as secondary validation.
3. Optional future testing on real production BPMN schemas when available.

### 8.1 Offline agent benchmark

The benchmark should run the same task suite against two tool variants:

```text
Variant A: baseline / current tool version
Variant B: candidate version with a new reading feature
```

For each task, collect:

- total tokens;
- CLI output tokens;
- number of tool calls;
- elapsed time;
- success/failure;
- correctness score;
- whether raw XML was used;
- command errors or retries.

### 8.2 Small human test

A small group of 3–5 developers may validate the benchmark quality and score ambiguous outputs.

This is not expected to provide statistically strong conclusions. It is used to detect obvious product issues:

- the benchmark task is unrealistic;
- the expected answer is unclear;
- the agent appears correct but misses important BPMN nuance;
- CLI output is hard to use.

### 8.3 Production BPMN schemas

Using real production BPMN files is considered the “luxury” or high-confidence option.

The benchmark must work without them. The implementation should include realistic synthetic BPMN fixtures that simulate production complexity.

If production BPMN files are later available, they can be added as a private benchmark pack.

## 9. Benchmark Task Design

Benchmark tasks must not be overly laboratory-like.

Bad benchmark example:

```text
Find the delegate of Task_1.
```

This is too simple and does not represent real agent work.

Good benchmark example:

```text
For a loan application process shared by multiple credit products, determine which service delegates may be executed for a working-capital loan path, taking into account product-type gateways, additional conditions, subprocesses, and asynchronous boundary events.
```

The benchmark should include both simple tasks and realistic multi-step tasks.

## 10. Benchmark Task Categories

The initial benchmark suite should cover these reading scenarios.

### T1. Process overview

Question examples:

- Summarize the process structure.
- Identify the main start and end outcomes.
- Count major task, gateway, event, subprocess, and implementation types.

### T2. Element lookup and inspection

Question examples:

- Find a task by business name.
- Explain what this task does and what happens before/after it.
- Identify the runtime implementation of the task.

### T3. Local context

Question examples:

- Explain the local context around a selected task.
- Identify previous and next significant nodes.
- Include nearby gateways, events, lanes, and implementation hooks.

### T4. Gateway and branch reasoning

Question examples:

- Explain all outgoing branches of a gateway.
- Identify conditions and branch targets.
- Determine which branch is taken for a specific product type or condition set.

### T5. Path and reachability

Question examples:

- Can the process reach Task B from Task A?
- Which conditions must be satisfied to reach a specific end state?
- Which delegates can be executed along a specific path?

### T6. Events and asynchronous behavior

Question examples:

- Which boundary timer events can interrupt the loan application flow?
- Where does the process go after an error boundary event?
- Which asynchronous events can affect the selected task?

### T7. Subprocess and call activity context

Question examples:

- What is inside this subprocess?
- Which subprocesses may be entered for this product type?
- What does a call activity invoke?

### T8. Runtime implementation context

Question examples:

- List all delegates/external topics that may be executed along a path.
- Find all user tasks with forms.
- Find all listeners attached to a task or process.

### T9. Variables and data flow

Question examples:

- Which variables are used in gateway conditions?
- Which variables are passed into and out of a call activity?
- Which variables influence routing for a specific product type?

### T10. Realistic composite scenario

Question example:

```text
In a shared credit application BPMN process, list all service delegates and external task topics that may be executed for product type “working capital loan”. The process contains product-type gateways, additional eligibility conditions, subprocesses, boundary timers, and error events. Provide the path reasoning and mention branches that were excluded.
```

This type of task is especially important because it reflects real BPMN development work.

## 11. Synthetic Fixture Requirements

The benchmark should include synthetic BPMN files that are realistic enough to test agent behavior.

Required fixtures:

### F1. Simple linear process

Purpose: baseline sanity checks.

Contains:

- start event;
- 3–5 tasks;
- end event;
- one service task implementation.

### F2. Gateway-heavy loan process

Purpose: branch reasoning.

Contains:

- product type gateway;
- conditions for multiple loan products;
- nested eligibility gateway;
- success/rejection/manual-review branches;
- service tasks with delegates.

### F3. Process with boundary events

Purpose: async and exception behavior.

Contains:

- boundary timer event;
- boundary error event;
- interrupting and non-interrupting behavior if possible;
- handler paths.

### F4. Collaboration with participants and message flows

Purpose: participant/lane/message flow reading.

Contains:

- multiple participants;
- message flows;
- lanes;
- tasks assigned to lanes.

### F5. Subprocess and call activity process

Purpose: subprocess hierarchy and contracts.

Contains:

- embedded subprocess;
- nested subprocess;
- call activity;
- Camunda in/out mappings;
- variables all / local flags where possible.

### F6. Complex realistic credit process

Purpose: composite benchmark.

Contains:

- product-specific branches;
- multiple service delegates;
- external tasks;
- forms;
- subprocesses;
- events;
- call activity mappings;
- conditions referencing variables.

This fixture should simulate a production-like BPMN process without using private production data.

## 12. Benchmark Data Model

The project should store benchmark definitions in a machine-readable format.

Suggested layout:

```text
benchmarks/
  fixtures/
  tasks/
  expected/
  runners/
  results/
```

Example task file:

```json
{
  "id": "credit-product-delegates-001",
  "title": "Delegates reachable for working capital loan",
  "fixture": "complex-credit-process.bpmn",
  "category": "path-runtime-composite",
  "prompt": "List all service delegates and external task topics that may be executed for product type 'working capital loan'. Include path reasoning and excluded branches.",
  "allowedTools": ["bpmn-agent-cli"],
  "successCriteria": [
    "mentions the product-type gateway",
    "includes delegates on the working-capital-loan branch",
    "excludes delegates from other product branches",
    "mentions relevant boundary event handlers if they may interrupt the path",
    "does not rely on raw BPMN XML"
  ],
  "scoring": {
    "maxScore": 3,
    "manualReviewRequired": true
  }
}
```

## 13. Metrics Logging Requirements

The CLI should support metrics logging for benchmark runs.

Suggested option:

```bash
bpmn-agent-cli <command> ... --trace-metrics .bpmn-agent-metrics.jsonl
```

Each CLI invocation should write a JSONL entry:

```json
{
  "timestamp": "2026-07-08T12:00:00.000Z",
  "command": "context",
  "fileHash": "sha256:...",
  "argsHash": "sha256:...",
  "durationMs": 42,
  "exitCode": 0,
  "stdoutBytes": 3412,
  "estimatedOutputTokens": 830,
  "errorCode": null
}
```

Privacy requirements:

- Do not log BPMN content.
- Do not log full command arguments if they may contain sensitive names.
- Prefer hashes and summary metadata.
- Allow metrics logging to be disabled by default.

## 14. Agent Benchmark Runner Requirements

The project should include a benchmark runner that can compare tool variants.

Example commands:

```bash
npm run benchmark -- --variant baseline
npm run benchmark -- --variant candidate
npm run benchmark:compare -- --baseline results/baseline.json --candidate results/candidate.json
```

Agent-executed benchmark runs are tracked separately:

```bash
npm run benchmark:agent -- --variant codex-current --agent codex
npm run benchmark:compare -- --baseline results/agent-baseline.json --candidate results/agent-candidate.json
```

In this mode the agent receives the task prompt, chooses commands itself, and real `bpmn-agent-cli` invocations are captured through a PATH wrapper. See `docs/AGENT_BENCHMARKS.md`.

The runner should produce a report with:

- task id;
- variant;
- success/failure;
- correctness score;
- token estimates;
- CLI calls;
- elapsed time;
- XML fallback flag;
- notes for manual review;
- aggregate comparison.

The first implementation may estimate tokens approximately from text length. Exact model token accounting can be added later.

## 15. A/B Testing Process

For each candidate reading improvement:

1. Select relevant benchmark tasks.
2. Run baseline version.
3. Implement candidate feature.
4. Run candidate version.
5. Compare metrics.
6. Perform manual review for ambiguous tasks.
7. Decide: strong accept, soft accept, revise, postpone, or reject.

The comparison should focus on:

- `tokens_per_successful_task`;
- `answer_correctness_score`;
- `task_success_rate`;
- `xml_fallback_rate`;
- `cli_calls_per_task`;
- `time_to_correct_answer_ms`.

## 16. Candidate Feature Registry

Do not implement all candidate features at once. Maintain a registry of hypotheses.

Initial candidate registry:

| ID | Candidate | Hypothesis | Primary metric | Expected risk |
|---|---|---|---|---|
| R1 | `element.details` | A richer element card reduces follow-up commands. | `cli_calls_per_task` | output may become too verbose |
| R2 | `context --profile agent` | A semantic context profile reduces tokens for local reasoning. | `tokens_per_successful_task` | profile may hide useful details |
| R3 | `variables` | Variable extraction improves correctness on data-flow tasks. | `answer_correctness_score` | expression parsing may be approximate |
| R4 | `call-activity` | Explicit call activity contracts improve subprocess understanding. | `task_success_rate` | Camunda mappings may be complex |
| R5 | `gateway 2.0` | Better branch explanation reduces branch interpretation errors. | `wrong_bpmn_interpretation_errors` | conditions may be hard to summarize |
| R6 | `map/export context pack` | A compressed process map improves overview tasks. | `time_to_correct_answer_ms` | output may be too generic |

The first implementation cycle should start with one small candidate feature after baseline measurement exists.

## 17. Recommended Implementation Plan

### Sprint 0 — Measurement foundation

Goal: make product decisions measurable.

Tasks:

- Create `docs/READING_METRICS_STRATEGY.md` from this document.
- Add benchmark directory structure.
- Add initial synthetic BPMN fixtures.
- Add 15–25 benchmark task definitions.
- Add metrics logging support.
- Add benchmark runner skeleton.
- Add benchmark comparison report.
- Run baseline benchmark against the current tool.

Acceptance criteria:

- Benchmark tasks can be executed repeatably.
- Metrics are collected for CLI calls.
- Baseline report exists.
- No new reading feature is required in this sprint.

### Sprint 1 — First small reading experiment

Goal: validate the metric loop with a small feature.

Recommended candidate:

```text
element.details
```

Tasks:

- Define hypothesis.
- Select benchmark subset.
- Implement candidate feature.
- Run A/B benchmark.
- Compare metrics.
- Decide: accept, revise, or postpone.

Acceptance criteria:

- The feature decision is based on measured results.
- Even if the feature is rejected, the evaluation loop is considered successful.

### Sprint 2 — Context optimization experiment

Goal: test whether a more agent-oriented context response saves tokens.

Recommended candidate:

```text
context --profile agent
```

Tasks:

- Define expected output profile.
- Run baseline on local-context tasks.
- Implement profile.
- Run candidate benchmark.
- Compare token and correctness metrics.

### Sprint 3 — Semantic reading experiment

Goal: test whether variable/call-activity understanding improves correctness on realistic tasks.

Candidate options:

- `variables`
- `call-activity`

Choose one based on benchmark gaps after Sprints 0–2.

## 18. Definition of Done for Reading Optimization Phase

The reading optimization phase is successful when:

- baseline metrics are available;
- at least 20 benchmark tasks exist;
- at least 5 realistic BPMN fixtures exist;
- at least 2 reading feature experiments have been evaluated;
- accepted features show measurable positive impact;
- agents use raw BPMN XML less often;
- tokens per successful BPMN-reading task decrease;
- correctness does not regress;
- the project has a repeatable process for evaluating future reading features.

Suggested initial target:

```text
- tokens_per_successful_task improves by 10% or more across the reading benchmark suite; or
- xml_fallback_rate drops by 30% or more; or
- answer_correctness_score improves on complex tasks without increasing token cost significantly.
```

This target is intentionally softer than a strict 20% token reduction. Small reliable improvements are valuable if they are stable and low-maintenance.

## 19. Instructions for the Coding Agent

When implementing this strategy:

1. Do not start by adding new BPMN reading features.
2. First implement the measurement and benchmark infrastructure.
3. Keep all benchmark fixtures synthetic unless the user explicitly provides production BPMN files.
4. Make synthetic fixtures realistic, not trivial.
5. Include composite tasks that resemble real BPMN development work.
6. Avoid logging sensitive BPMN content in metrics.
7. Keep the benchmark deterministic and repeatable.
8. Do not require network calls or LLM calls inside the CLI itself.
9. If an LLM-based benchmark runner is added, keep it separate from the CLI runtime.
10. Make feature acceptance decisions based on metrics and documented review notes.

The goal is not to maximize the number of commands. The goal is to prove that each accepted feature makes BPMN reading cheaper, faster, or more correct for agents.

## 20. Immediate Next Tasks

Recommended concrete tasks for the development team:

1. Add this document as `docs/READING_METRICS_STRATEGY.md`.
2. Add `benchmarks/` directory structure.
3. Create initial synthetic BPMN fixtures, including a realistic credit application process.
4. Create 15–25 benchmark task definitions.
5. Implement CLI metrics logging with `--trace-metrics`.
6. Implement benchmark runner skeleton.
7. Implement benchmark comparison report.
8. Run and commit/share the first baseline report.
9. Choose the first candidate feature only after baseline results are available.
10. Run the first A/B experiment and document the decision.
