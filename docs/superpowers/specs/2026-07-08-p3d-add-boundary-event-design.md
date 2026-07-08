# P3-D Add Boundary Event Design

## Goal

Add a structural command for attaching a timer boundary event to an existing activity:

```bash
bpmn-agent-cli add-boundary-event process.bpmn --attached-to Task_1 --id Boundary_Timeout --target Task_Handler --flow-id Flow_Timeout_Handler --duration PT10M
```

## Scope

P3-D supports one event type:

- boundary timer event
- attached to an existing activity-like flow node
- one outgoing sequence flow to an existing target flow node
- `cancelActivity` defaults to `true`
- optional `--name`

P3-D does not update BPMNDI layout and returns `DI_NOT_UPDATED`.

## CLI Contract

```bash
bpmn-agent-cli add-boundary-event <file> \
  --attached-to <activityId> \
  --id <boundaryEventId> \
  --target <targetElementId> \
  --flow-id <sequenceFlowId> \
  --duration <ISO-8601-duration-or-expression> \
  [--name <eventName>] \
  [--non-interrupting] \
  [--write] \
  [-o <output>] \
  [--pretty]
```

Rules:

- Required: `file`, `--attached-to`, `--id`, `--target`, `--flow-id`, `--duration`.
- `--attached-to` must be an activity-like element: task, user task, service task, manual task, script task, business rule task, send task, receive task, subprocess, ad-hoc subprocess, transaction, or call activity.
- `--target` must be an existing flow node and not a sequence flow.
- Boundary event id and flow id must be unique.
- `--non-interrupting` writes `cancelActivity="false"`.
- `-o` is allowed only with `--write`.

## Result Schema

```ts
type AddBoundaryEventResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  boundaryEvent: EventSummary;
  attachedTo: ElementSummary;
  target: ElementSummary;
  flow: SequenceFlowSummary;
  timer: {
    duration: string;
    cancelActivity: boolean;
  };
  warnings: Diagnostic[];
  diff: Array<{
    op: "add" | "replace";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

## Error Handling

- Missing required option: `INVALID_OPTION_VALUE`, exit `2`.
- Duplicate id: `INVALID_OPTION_VALUE`, exit `2`.
- Unknown attached or target id: `ELEMENT_NOT_FOUND`, exit `1`.
- Unsupported attached or target type: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- XML patch target cannot be found: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Patched XML parse failure: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/addBoundaryEvent.ts`: pure patcher.
- `src/cli/commands/addBoundaryEventCommand.ts`: CLI validation and write flow.
- `src/cli/main.ts`: route `add-boundary-event`.

The patcher inserts boundary event and sequence flow after the attached element, appends an incoming reference to target, ensures `xmlns:xsi`, validates ids through existing indexes, and leaves BPMNDI generation for a later backlog item.

## Testing

- Pure patcher adds timer boundary event to `Task_1` in `simple-linear.bpmn`.
- Patched XML parses.
- `DI_NOT_UPDATED` warning exists.
- Duplicate id is rejected.
- Unsupported attached type is rejected.
- CLI dry-run does not modify input.
- CLI `--write -o` writes valid XML.
- CLI rejects `-o` without `--write`.

