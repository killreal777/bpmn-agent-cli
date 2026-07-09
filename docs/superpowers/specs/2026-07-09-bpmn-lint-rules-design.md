# BPMN Lint Rules Design

## Goal

Extend `validate` with deterministic BPMN lint warnings that help agents review process quality without reading raw XML.

## CLI Contract

```bash
bpmn-agent-cli validate process.bpmn
```

No new flag is required for this iteration. Lint findings are warnings, so they do not make `valid` false and do not change the successful exit code.

## Rules

P4 lint warnings:

- `SERVICE_TASK_MISSING_IMPLEMENTATION`: `bpmn:ServiceTask` has no class, delegate expression, expression, external topic, or listener implementation detected.
- `EXTERNAL_TASK_MISSING_TOPIC`: a Camunda external service task has no `camunda:topic`.
- `GATEWAY_OUTGOING_WITHOUT_CONDITION`: an exclusive or inclusive gateway has an outgoing sequence flow without a condition.
- `DEAD_END_FLOW_NODE`: a non-end flow node has no outgoing sequence flow.
- `UNREACHABLE_FLOW_NODE`: a non-start flow node is not reachable from a start event in the same process by sequence flow traversal.
- `DUPLICATE_NAME_IN_PROCESS`: two or more indexed elements in the same process share the same normalized non-empty name.
- `BOUNDARY_EVENT_WITHOUT_HANDLER`: a boundary event has no outgoing handler sequence flow.
- `CALL_ACTIVITY_MISSING_CALLED_ELEMENT`: a call activity has no `calledElement`.

## Reachability

Reachability is process-local. Traversal starts from all `bpmn:StartEvent` elements in a process and follows outgoing sequence flows. Boundary events attached to a reachable element are considered reachable, and traversal continues through their outgoing flows.

## Non-Goals

- No configurable lint profile yet.
- No BPMNDI/layout lint.
- No custom XML parser.
- No expression execution or runtime Camunda validation.
