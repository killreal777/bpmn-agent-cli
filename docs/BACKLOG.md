# Product Backlog

Backlog priority:

- `P3`: finish currently planned structural BPMN write commands.
- `P4`: high-value product capabilities after structural writes.
- `P5`: larger workflow, ecosystem, or polish work.

Status values:

- `proposed`: idea is captured but not designed.
- `ready-for-spec`: scope is clear enough to write a design.
- `blocked`: depends on another backlog item.

## P3: Structural Write Completion

### BL-001: `delete-safe`

Priority: `P3`
Status: `ready-for-spec`

Delete one BPMN element only when the operation is structurally safe. P3 scope should support deleting a task-like node with exactly one incoming and one outgoing sequence flow, reconnecting source to target or refusing if semantics are ambiguous.

Acceptance direction:

- Dry-run default and explicit `--write`.
- Refuse gateways, events, subprocesses, boundary events, message flows, and elements with multiple incoming/outgoing in the first version.
- Validate patched BPMN XML before writing.
- Return machine-readable diff and safety reason.

### BL-002: `add-boundary-event`

Priority: `P3`
Status: `ready-for-spec`

Attach a boundary event to an existing activity and connect it to a handler target.

Acceptance direction:

- Support timer boundary event first.
- Optional interrupting/non-interrupting flag.
- Create boundary event, event definition, outgoing sequence flow, and target incoming reference.
- Return `DI_NOT_UPDATED` until layout support exists.

### BL-003: Structural Write Safety Matrix

Priority: `P3`
Status: `proposed`

Create a documented safety matrix for each write command describing supported element types, refused cases, semantic risks, and future expansion.

## P4: Review And Confidence

### BL-004: `diff`

Priority: `P4`
Status: `ready-for-spec`

Compare two BPMN files semantically and return added, removed, renamed, reconnected, implementation-changed, and documentation-changed elements.

Acceptance direction:

- JSON envelope with stable sorted changes.
- Optional markdown report.
- Ignore pure formatting differences.
- Include sequence flow topology changes.

### BL-005: `plan-write`

Priority: `P4`
Status: `proposed`

Produce a write plan without changing files, combining what a write command would modify, what validations would run, and what risks/warnings apply.

Acceptance direction:

- Works for all write commands.
- Output includes commands to execute and expected result schema.
- Useful for agent self-review before `--write`.

### BL-006: BPMN Lint Rules

Priority: `P4`
Status: `ready-for-spec`

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

### BL-007: `impact`

Priority: `P4`
Status: `proposed`

Given an element id, report downstream and upstream impact including paths, participants, lanes, events, implementations, and call activities affected by a change.

### BL-008: `review`

Priority: `P4`
Status: `proposed`

Generate a human-readable review packet for a BPMN file or BPMN diff: overview, risky branches, implementations, events, lanes, warnings, and suggested review checklist.

## P4: Agent Context And Query Expansion

### BL-009: `query`

Priority: `P4`
Status: `proposed`

Add a constrained query command over the deterministic index, not natural language at runtime.

Example:

```bash
bpmn-agent-cli query process.bpmn --where 'type=bpmn:ServiceTask and implementation.kind=externalTask'
```

### BL-010: Repository Batch Mode

Priority: `P4`
Status: `proposed`

Run read, validate, lint, and report commands across many BPMN files.

Acceptance direction:

- Input paths are explicit globs or file lists.
- Output is stable JSON with per-file envelopes.
- No reading unrelated project files during BPMN analysis.

### BL-011: `schema`

Priority: `P4`
Status: `proposed`

Print JSON schemas for command outputs and errors so downstream agents and CI can validate contracts.

### BL-012: Shell Completion

Priority: `P4`
Status: `proposed`

Generate shell completions for commands and options.

## P5: Visual And Layout Support

### BL-013: BPMNDI Layout For Inserted Elements

Priority: `P5`
Status: `blocked`

Add optional layout generation for `insert-task-between`, `connect`, and boundary event creation.

Blocked by:

- Structural write commands need stable semantic behavior first.
- Layout strategy must be deterministic and testable.

### BL-014: `layout-check`

Priority: `P5`
Status: `proposed`

Detect semantic BPMN elements that have no BPMNDI shape/edge and report layout gaps.

### BL-015: SVG Preview Export

Priority: `P5`
Status: `proposed`

Export a simple SVG preview or diagram metadata snapshot for agents and code review.

## P5: Distribution And Ecosystem

### BL-016: npm Package Release

Priority: `P5`
Status: `proposed`

Prepare public npm publishing alongside GitHub extension installation.

### BL-017: GitHub Action

Priority: `P5`
Status: `proposed`

Provide a GitHub Action for BPMN validation, lint, and review report generation.

### BL-018: MCP Server

Priority: `P5`
Status: `proposed`

Expose read/query/validate commands through a local MCP server for tools that prefer tool calls over CLI subprocesses.

### BL-019: Versioned Output Contracts

Priority: `P5`
Status: `proposed`

Add explicit output contract versioning and compatibility policy.

## P5: Camunda And BPMN Coverage

### BL-020: Camunda Input/Output Mappings

Priority: `P5`
Status: `proposed`

Read and safely edit Camunda input/output mappings for call activities and service tasks.

### BL-021: Listener Editing

Priority: `P5`
Status: `proposed`

Safely add, replace, and remove execution/task listeners in `extensionElements`.

### BL-022: Message Flow Editing

Priority: `P5`
Status: `proposed`

Add safe commands for creating and deleting message flows in collaborations.

### BL-023: Event Definition Editing

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

