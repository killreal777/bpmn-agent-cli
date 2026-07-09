# Product Backlog

Backlog priority:

- `P3`: finish currently planned structural BPMN write commands.
- `P4`: reading metrics foundation and read-side understanding improvements for agents.
- `P5`: larger workflow, ecosystem, or polish work.

Status values:

- `proposed`: idea is captured but not designed.
- `ready-for-spec`: scope is clear enough to write a design.
- `blocked`: depends on another backlog item.

## P3: Structural Write Completion

### BL-001: `delete-safe`

Priority: `P3`
Status: `implemented`

Delete one BPMN element only when the operation is structurally safe. P3 scope should support deleting a task-like node with exactly one incoming and one outgoing sequence flow, reconnecting source to target or refusing if semantics are ambiguous.

Implemented scope:

- Dry-run default and explicit `--write`.
- Refuses gateways, events, subprocesses, boundary events, sequence flows, call activities, and elements with multiple incoming/outgoing.
- Validates patched BPMN XML before writing.
- Returns machine-readable diff and `DI_NOT_UPDATED`.

### BL-002: `add-boundary-event`

Priority: `P3`
Status: `implemented`

Attach a boundary event to an existing activity and connect it to a handler target.

Implemented scope:

- Support timer boundary event first.
- Optional interrupting/non-interrupting flag.
- Creates boundary event, timer event definition, outgoing sequence flow, and target incoming reference.
- Returns `DI_NOT_UPDATED` until layout support exists.

### BL-003: Structural Write Safety Matrix

Priority: `P3`
Status: `proposed`

Create a documented safety matrix for each write command describing supported element types, refused cases, semantic risks, and future expansion.

## P4: Reading Metrics Foundation

### BL-004: Reading Metrics Strategy

Priority: `P4`
Status: `implemented`

Adopt the metric-first reading optimization approach as `docs/READING_METRICS_STRATEGY.md`.

Acceptance:

- Product decisions for new read features are framed as measurable hypotheses.
- Baseline/candidate comparison is documented before large read-side feature expansion.
- Candidate features are judged by token cost, task success, correctness, XML fallback, tool calls, and command confusion.

### BL-005: Reading Benchmark Fixtures And Tasks

Priority: `P4`
Status: `implemented`

Add a deterministic offline benchmark suite for BPMN reading tasks.

Initial scope:

- `benchmarks/fixtures/` with synthetic BPMN files only.
- At least 5 realistic fixtures: linear process, gateway-heavy loan process, boundary events, collaboration/lanes/message flows, subprocess/call activity process.
- At least 20 task definitions across overview, element inspection, local context, gateway reasoning, path/reachability, events, subprocess/call activity, implementations, variables, and composite scenarios.
- Expected-answer metadata and scoring rubrics that do not require production BPMN files.

Implemented scope:

- 5 synthetic BPMN fixtures under `benchmarks/fixtures/`.
- 20 task definitions under `benchmarks/tasks/`.
- Task definitions include executable `cliCalls` for deterministic offline benchmark runs.

### BL-006: CLI Metrics Logging

Priority: `P4`
Status: `implemented`

Add opt-in metrics tracing for benchmark runs.

Command direction:

```bash
bpmn-agent-cli overview process.bpmn --trace-metrics .bpmn-agent-metrics.jsonl
```

Requirements:

- Disabled by default.
- Append JSONL entries per CLI invocation.
- Log command name, file hash, args hash, duration, exit code, stdout bytes, estimated output tokens, and error code.
- Do not log BPMN content or full sensitive arguments.
- JSON stdout must remain valid command output only.

Implemented scope:

- `--trace-metrics <path>` appends privacy-preserving JSONL entries.
- File content and argument values are hashed.
- Command JSON stdout remains unchanged.

### BL-007: Benchmark Runner And Comparison Report

Priority: `P4`
Status: `implemented`

Add npm scripts and runner skeleton for comparing baseline and candidate tool variants.

Command direction:

```bash
npm run benchmark -- --variant baseline
npm run benchmark -- --variant candidate
npm run benchmark:compare -- --baseline results/baseline.json --candidate results/candidate.json
```

Report direction:

- task id and category
- variant
- success/failure
- correctness score
- estimated tokens
- CLI call count
- elapsed time
- XML fallback flag
- tool errors/retries
- aggregate comparison

Implemented scope:

- `npm run benchmark`.
- `npm run benchmark:compare`.
- Smoke-tested one-task benchmark and self-comparison.

### BL-008: Baseline Reading Report

Priority: `P4`
Status: `implemented`

Run the first benchmark against the current CLI and commit a baseline report.

Blocked by:

- BL-005 benchmark fixtures and tasks.
- BL-006 CLI metrics logging.
- BL-007 benchmark runner and comparison report.

Acceptance:

- Baseline report exists under `benchmarks/results/`.
- Report includes enough data to choose the first read feature experiment.
- No new reading feature is required for this backlog item.

Implemented baseline:

- Report: `benchmarks/results/baseline.json`.
- Tasks: 20.
- Successful tasks: 20.
- CLI calls: 36.
- Estimated output tokens: 8843.
- XML fallback rate: 0.
- Tool errors: 0.

### BL-009: Agent-Executed Benchmark Runner

Priority: `P4`
Status: `implemented`

Run benchmark tasks through a real agent process instead of only executing predefined CLI calls.

Implemented scope:

- `npm run benchmark:agent`.
- Codex preset via `--agent codex`.
- Generic custom agent support via `--agent-command`.
- Temporary PATH wrapper captures real `bpmn-agent-cli` invocations and writes `cli-metrics.jsonl`.
- Reports include `answerCorrectnessScore`, matched/missing criteria, XML fallback detection, agent output token estimate, and real CLI call count.
- `benchmark:compare` compares agent-specific metrics.

## P4: Variable And Element Understanding

### BL-010: `variables`

Priority: `P4`
Status: `implemented`

Add a read-only command that extracts process variable usage from BPMN/Camunda metadata and expressions.

Initial scope:

- Camunda `camunda:in` and `camunda:out` mappings on `bpmn:CallActivity`.
- Mapping attributes: `source`, `sourceExpression`, `target`, `variables`, `businessKey`, `local`.
- Sequence flow condition expressions as variable read candidates.
- Camunda `expression` and `delegateExpression` as expression usage candidates.
- Element-level grouping: each usage must point back to element id/name/type.
- Usage direction: `read`, `write`, `in`, `out`, `pass-through`, or `unknown`.

Command direction:

```bash
bpmn-agent-cli variables process.bpmn
bpmn-agent-cli variables process.bpmn --element Call_SubProcess
bpmn-agent-cli variables process.bpmn --name customerId
```

Result direction:

- `variables`: normalized variable list.
- `usages`: all detected usages sorted by variable name, element id, direction.
- `callActivityMappings`: structured in/out mappings for call activities.
- `warnings`: ambiguous expressions and unsupported mapping forms.

This is the highest-priority semantic read improvement because agents need to understand BPMN context variables before safely reviewing or modifying workflows. Implementation should follow the metrics foundation unless the feature is needed to unblock benchmark tasks.

Implemented scope:

- `bpmn-agent-cli variables process.bpmn`.
- `--element <id>` filters usages and CallActivity mappings to one element.
- `--name <variable>` filters usages and mappings to one variable.
- Extracts CallActivity `camunda:in` and `camunda:out` mappings.
- Extracts `variables="all"` pass-through as `*`.
- Extracts sequence-flow condition variable candidates.
- Extracts service-task implementation expression candidates and user-task form key candidates.

Measured result:

- Candidate report: `benchmarks/results/candidate-variables.json`.
- Comparison report: `benchmarks/results/compare-variables.json`.
- Successful tasks: unchanged at 20/20.
- CLI calls: 36 -> 35.
- Estimated output tokens: +1223 across the 20-task suite.
- Decision: accepted as a correctness-enabling semantic read feature. Future work should add a compact/profile mode or benchmark scoring that captures reduced manual/XML fallback for variable questions.

### BL-011: Enrich `element` With Type-Specific Details

Priority: `P4`
Status: `implemented`

Extend the existing `element` command so it returns specialized detail sections depending on element type.

Initial strategies:

- `bpmn:CallActivity`: include `calledElement`, Camunda in/out mappings, business key mapping, variable pass-through, and mapping warnings.
- `bpmn:ServiceTask`: include implementation metadata and variable candidates from expressions.
- `bpmn:UserTask`: include form key and variable candidates from form-related metadata when available.
- `bpmn:SequenceFlow`: include condition expression and variable read candidates.
- `bpmn:BoundaryEvent`: include event definition details and attached element summary.

The command should keep the current compact element summary but add a `details` object that is stable, JSON-first, and omits raw/noisy moddle internals.

Metrics hypothesis:

- A richer element card reduces follow-up CLI calls for element inspection tasks without making output too verbose.

Implemented scope:

- `bpmn:CallActivity` details include `calledElement`, Camunda `camunda:in` mappings, Camunda `camunda:out` mappings, pass-through `variables="all"`, `local`, and variable candidates.
- `bpmn:ServiceTask` details include implementation type, topic, delegate expression, class, expression, and variable candidates.
- `bpmn:UserTask` details include form key and variable candidates.
- `bpmn:SequenceFlow` details include condition and variable candidates.
- `bpmn:BoundaryEvent` details include attached element, `cancelActivity`, and event definitions.

Measured result:

- Candidate report: `benchmarks/results/candidate-element-details.json`.
- Comparison report: `benchmarks/results/compare-element-details.json`.
- Successful tasks: unchanged at 20/20.
- CLI calls: unchanged at 36.
- Estimated output tokens: +424 across the 20-task suite.
- Decision: accepted as a correctness-enabling read improvement because CallActivity mappings and type-specific context are now available without raw XML; follow-up benchmark work should add correctness scoring or adaptive task plans to measure reduced follow-up calls.

### BL-012: `call-activity`

Priority: `P4`
Status: `implemented`

Add a focused read-only command for call activity contracts.

Command direction:

```bash
bpmn-agent-cli call-activity process.bpmn --id Call_SubProcess
bpmn-agent-cli call-activity process.bpmn
```

Output should include:

- called element/key
- all `camunda:in` mappings
- all `camunda:out` mappings
- `variables="all"` pass-through
- business key mapping
- local variable flags
- unresolved or unsupported mapping warnings
- optional relationship to `variables` result

This can share the same extraction layer as `variables` and enriched `element`.

Implemented scope:

- `bpmn-agent-cli call-activity process.bpmn`.
- `bpmn-agent-cli call-activity process.bpmn --id Call_SubProcess`.
- Returns called element, input mappings, output mappings, pass-through detection, business key value, variable names, variable summaries, and warnings.
- Rejects existing non-CallActivity ids with `UNSUPPORTED_BPMN_ELEMENT_TYPE`.
- Reuses the same CallActivity extraction layer as `element.details` and `variables`.

Measured result:

- Candidate report: `benchmarks/results/candidate-call-activity.json`.
- Comparison report: `benchmarks/results/compare-call-activity.json`.
- Successful tasks: unchanged at 20/20.
- CLI calls improved: 36 -> 34 after the CallActivity benchmark task switched from `element` + `implementations` to `call-activity`.
- Estimated output tokens increased by 1159 across the 20-task suite because the focused contract includes variable summaries and mapping details.
- Decision: accepted as a correctness-enabling and call-reducing read feature. Future compact/profile work should reduce token cost for focused semantic commands.

### BL-013: Variable-Aware Lint Rules

Priority: `P4`
Status: `implemented`

Add lint diagnostics based on extracted variable usage.

Initial rules:

- call activity with no explicit mappings and no `variables="all"`.
- `camunda:in` mapping missing target.
- `camunda:out` mapping missing target.
- `sourceExpression` without target.
- suspicious pass-through of all variables.
- condition expression references variables with no detected producer.

Implemented scope:

- Added warnings-only diagnostics to `validate`.
- Implemented CallActivity mapping checks for missing mappings, missing input/output targets, source expressions without targets, and `variables="all"` pass-through.
- Implemented best-effort condition variable producer check for sequence-flow conditions.
- Reused existing `variables` and `call-activity` extraction; no custom XML parser or expression execution.

### BL-013A: `context --profile agent`

Priority: `P4`
Status: `implemented`

Add a compact context profile for agent local reasoning.

Implemented scope:

- `bpmn-agent-cli context process.bpmn --id Task_1 --profile agent`.
- Default `context` output remains unchanged.
- Agent profile keeps a full summary for the focus element and returns compact `nodeIds`, `flowIds`, flow conditions, boundary events, and immediate incoming/outgoing ids.
- Invalid profile values return `INVALID_OPTION_VALUE`.

Measured result:

- Candidate report: `benchmarks/results/candidate-context-agent-profile.json`.
- Comparison report: `benchmarks/results/compare-context-agent-profile.json`.
- Incremental comparison report: `benchmarks/results/compare-context-agent-profile-incremental.json`.
- Successful tasks: unchanged at 20/20.
- CLI calls: unchanged at 34 compared with `candidate-call-activity`.
- Estimated output tokens improved by 92 compared with `candidate-call-activity`.
- Decision: soft accept as a low-risk token reduction for local context tasks.

### BL-014: JSON Conversion Modernization

Priority: `P4`
Status: `implemented`

Keep `to-json` as a first-class JSON conversion feature while removing outdated compatibility terminology from active architecture and documentation.

Direction:

- Keep `to-json` as the full BPMN-to-JSON conversion command.
- Keep successful `to-json` output as raw converted JSON because that is the command product.
- Use focused commands such as `overview`, `element`, `variables`, and `call-activity` for targeted agent reading.
- Move active converter implementation to `src/convert`.
- Keep historical references only in old implementation specs where they describe past decisions.

Implemented scope:

- Converter source moved to `src/convert`.
- Converter tests moved to `test/convert`.
- Active docs describe `to-json` as JSON conversion, not as a compatibility-only command.
- `to-json` CLI behavior and raw JSON output remain compatible.

## P4: Review And Confidence

### BL-015: `diff`

Priority: `P4`
Status: `implemented`

Compare two BPMN files semantically and return added, removed, renamed, reconnected, implementation-changed, and documentation-changed elements.

Acceptance direction:

- JSON envelope with stable sorted changes.
- Ignore pure formatting differences.
- Include sequence flow topology changes.
- Include implementation and documentation changes.

Implemented scope:

- `bpmn-agent-cli diff --base before.bpmn --candidate after.bpmn`.
- Compares indexed semantic BPMN elements by id.
- Reports added, removed, renamed, reconnected sequence flows, implementation changes, and documentation changes.
- Ignores XML formatting and BPMNDI-only layout differences.
- Does not perform fuzzy matching for deleted/recreated ids.

### BL-016: `plan-write`

Priority: `P4`
Status: `proposed`

Produce a write plan without changing files, combining what a write command would modify, what validations would run, and what risks/warnings apply.

Acceptance direction:

- Works for all write commands.
- Output includes commands to execute and expected result schema.
- Useful for agent self-review before `--write`.

### BL-017: BPMN Lint Rules

Priority: `P4`
Status: `implemented`

Extend `validate` with configurable semantic lint rules.

Initial rules:

- service task missing implementation
- external task missing topic
- gateway outgoing flow missing conditions
- dead-end flow node
- unreachable node from start event
- duplicate names in same process
- boundary event without outgoing handler
- call activity missing called element

Implemented scope:

- Added warnings-only diagnostics to `validate`.
- Service task missing implementation.
- External task missing topic.
- Exclusive/inclusive gateway outgoing flow missing condition.
- Dead-end non-end flow node.
- Flow node unreachable from process start event.
- Duplicate normalized names in the same process.
- Boundary event without outgoing handler.
- Call activity missing called element.

### BL-018: `impact`

Priority: `P4`
Status: `proposed`

Given an element id, report downstream and upstream impact including paths, participants, lanes, events, implementations, and call activities affected by a change.

### BL-019: `review`

Priority: `P4`
Status: `proposed`

Generate a human-readable review packet for a BPMN file or BPMN diff: overview, risky branches, implementations, events, lanes, warnings, and suggested review checklist.

## P4: Agent Context And Query Expansion

### BL-020: `query`

Priority: `P4`
Status: `proposed`

Add a constrained query command over the deterministic index, not natural language at runtime.

Example:

```bash
bpmn-agent-cli query process.bpmn --where 'type=bpmn:ServiceTask and implementation.kind=externalTask'
```

### BL-021: Repository Batch Mode

Priority: `P4`
Status: `proposed`

Run read, validate, lint, and report commands across many BPMN files.

Acceptance direction:

- Input paths are explicit globs or file lists.
- Output is stable JSON with per-file envelopes.
- No reading unrelated project files during BPMN analysis.

### BL-022: `schema`

Priority: `P4`
Status: `proposed`

Print JSON schemas for command outputs and errors so downstream agents and CI can validate contracts.

### BL-023: Shell Completion

Priority: `P4`
Status: `proposed`

Generate shell completions for commands and options.

## P5: Visual And Layout Support

### BL-024: BPMNDI Layout For Inserted Elements

Priority: `P5`
Status: `blocked`

Add optional layout generation for `insert-task-between`, `connect`, and boundary event creation.

Blocked by:

- Structural write commands need stable semantic behavior first.
- Layout strategy must be deterministic and testable.

### BL-025: `layout-check`

Priority: `P5`
Status: `proposed`

Detect semantic BPMN elements that have no BPMNDI shape/edge and report layout gaps.

### BL-026: SVG Preview Export

Priority: `P5`
Status: `proposed`

Export a simple SVG preview or diagram metadata snapshot for agents and code review.

## P5: Distribution And Ecosystem

### BL-027: npm Package Release

Priority: `P5`
Status: `proposed`

Prepare public npm publishing alongside GitHub extension installation.

### BL-028: GitHub Action

Priority: `P5`
Status: `proposed`

Provide a GitHub Action for BPMN validation, lint, and review report generation.

### BL-029: MCP Server

Priority: `P5`
Status: `proposed`

Expose read/query/validate commands through a local MCP server for tools that prefer tool calls over CLI subprocesses.

### BL-030: Versioned Output Contracts

Priority: `P5`
Status: `proposed`

Add explicit output contract versioning and compatibility policy.

## P5: Camunda And BPMN Coverage

### BL-031: Camunda Input/Output Mapping Editing

Priority: `P5`
Status: `proposed`

Safely edit Camunda input/output mappings for call activities and service tasks. Read-only mapping extraction is now tracked earlier under `variables`, enriched `element`, and `call-activity`.

### BL-032: Listener Editing

Priority: `P5`
Status: `proposed`

Safely add, replace, and remove execution/task listeners in `extensionElements`.

### BL-033: Message Flow Editing

Priority: `P5`
Status: `proposed`

Add safe commands for creating and deleting message flows in collaborations.

### BL-034: Event Definition Editing

Priority: `P5`
Status: `proposed`

Support changing timer, message, signal, error, escalation, and conditional event definitions.

## Backlog Hygiene

Each backlog item should become a design spec before implementation. A good spec must define:

- command contract
- result schema
- supported and refused cases
- validation pipeline
- test fixtures
- extension bundle smoke test
