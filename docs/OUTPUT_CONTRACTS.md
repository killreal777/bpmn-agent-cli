# Output Contracts

## Success Envelope

All P0 and P1-A query commands except `to-json` return:

```json
{
  "ok": true,
  "command": "overview",
  "file": "process.bpmn",
  "result": {}
}
```

## Legacy to-json Exception

`to-json` preserves the raw converter output shape. `to-json --print-config` returns raw config JSON.

## Error Envelope

```json
{
  "ok": false,
  "error": {
    "code": "ELEMENT_NOT_FOUND",
    "message": "Element not found",
    "details": {
      "elementId": "Task_X"
    },
    "suggestions": []
  }
}
```

Suggestions are limited to five items and sorted by score descending, then id ascending.

## Exit Codes

- `0`: success
- `1`: validation failed or domain error
- `2`: invalid CLI arguments
- `3`: file not found or cannot read
- `4`: BPMN/XML parse error
- `5`: internal error

## Error Codes

- `MISSING_FILE_ARGUMENT`
- `INVALID_COMMAND`
- `INVALID_OPTION_VALUE`
- `FILE_NOT_FOUND`
- `FILE_READ_ERROR`
- `BPMN_PARSE_ERROR`
- `ELEMENT_NOT_FOUND`
- `ELEMENT_IS_NOT_GATEWAY`
- `INVALID_TYPE_FILTER`
- `UNSUPPORTED_BPMN_ELEMENT_TYPE`
- `REFERENCE_NOT_FOUND`
- `VALIDATION_FAILED`
- `OUTPUT_WRITE_ERROR`
- `INTERNAL_ERROR`

## ValidateResult

```ts
export type ValidateResult = {
  valid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
  infos: Diagnostic[];
};
```

## ParticipantsResult

```ts
type ParticipantsResult = {
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: ParticipantSummary[];
    messageFlows: MessageFlowSummary[];
  }>;
  unreferencedProcesses: Array<{ id: string; name: string | null }>;
};
```

## LanesResult

```ts
type LanesResult = {
  lanes: Array<{
    id: string;
    name: string | null;
    processId: string | null;
    flowNodes: ElementSummary[];
  }>;
  elementLanes: Array<{
    element: ElementSummary;
    lanes: LaneSummary[];
  }>;
};
```

Without `--element`, `elementLanes` is empty. With `--element`, it contains exactly one entry for the requested element.

## EventsResult

```ts
type EventDefinitionSummary = {
  type: string;
  value?: string | null;
  refId?: string | null;
  refName?: string | null;
};

type EventsResult = {
  events: Array<EventSummary & {
    category: "start" | "end" | "boundary" | "intermediate" | "other";
    eventDefinitions: EventDefinitionSummary[];
    attachedTo?: ElementSummary | null;
    outgoing: SequenceFlowSummary[];
    incoming: SequenceFlowSummary[];
  }>;
};
```

`bpmn:EventBasedGateway` is a gateway and is not returned by `events`.

## SubprocessResult

```ts
type SubprocessResult = {
  subprocesses: Array<{
    element: ElementSummary;
    parentSubprocessId: string | null;
    children: ElementSummary[];
    nestedSubprocesses: ElementSummary[];
    incoming: SequenceFlowSummary[];
    outgoing: SequenceFlowSummary[];
    boundaryEvents: EventSummary[];
  }>;
};
```

## PathResult

```ts
type PathResult = {
  from: ElementSummary;
  to: ElementSummary;
  direction: "forward" | "backward";
  depth: number;
  paths: PathSummary[];
  found: boolean;
  truncated: boolean;
};
```

`paths` contains only paths that reach `to`. For both directions, path nodes are returned in requested endpoint order from `from` to `to`.

## ExportResult

```ts
type ExportSection =
  | "overview"
  | "participants"
  | "lanes"
  | "events"
  | "subprocess"
  | "implementations";

type ExportResult = {
  format: "json";
  sections: ExportSection[];
  overview?: OverviewResult;
  participants?: ParticipantsResult;
  lanes?: LanesResult;
  events?: EventsResult;
  subprocess?: SubprocessResult;
  implementations?: ImplementationsResult;
};
```

`export --format json` uses the success envelope. `export --format markdown` and `export --format text` write raw successful export content.

## RenameResult

```ts
type RenameResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: { name: string | null };
  after: { name: string };
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

`rename` uses the success envelope. Dry-run is default and reports the planned diff without writing files.

## DocumentationResult

```ts
type DocumentationResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: { documentation: string | null };
  after: { documentation: string };
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

`documentation` uses the success envelope. Dry-run is default and reports the planned documentation diff without writing files.

## ImplementationPatchResult

```ts
type ImplementationPatchResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  kind: "delegateExpression" | "class" | "expression" | "externalTask" | "form" | "callActivity";
  before: Record<string, string | null>;
  after: Record<string, string>;
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

`implementation` uses the success envelope. Dry-run is default and reports the planned implementation diff without writing files. For `externalTask`, `diff` contains both `camunda:type` and `camunda:topic`.

## FormatResult

```ts
type FormatResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  changed: boolean;
  before: {
    bytes: number;
  };
  after: {
    bytes: number;
  };
  diagnostics: {
    warnings: Array<{ message: string }>;
  };
};
```

`format` uses the success envelope. Dry-run is default and reports byte counts plus whether moddle serialization differs from the input XML. Formatted XML is not emitted to stdout.

## InsertTaskBetweenResult

```ts
type InsertTaskBetweenResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  inserted: ElementSummary;
  replacedFlow: SequenceFlowSummary;
  newFlows: SequenceFlowSummary[];
  warnings: Diagnostic[];
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

`insert-task-between` uses the success envelope. Dry-run is default and reports the planned structural diff without writing files. P3-A does not update BPMNDI layout and returns `DI_NOT_UPDATED` in `warnings`.

## ConnectResult

```ts
type ConnectResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  flow: SequenceFlowSummary;
  source: ElementSummary;
  target: ElementSummary;
  warnings: Diagnostic[];
  diff: Array<{
    op: "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

`connect` uses the success envelope. Dry-run is default and reports the planned structural diff without writing files. P3-B does not update BPMNDI layout and returns `DI_NOT_UPDATED` in `warnings`.

## DeleteSafeResult

```ts
type DeleteSafeResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  deleted: ElementSummary;
  removedFlows: SequenceFlowSummary[];
  replacementFlow: SequenceFlowSummary;
  warnings: Diagnostic[];
  diff: Array<{
    op: "remove" | "add" | "replace";
    path: string;
    before: string | null;
    after: string | null;
  }>;
};
```

`delete-safe` uses the success envelope. Dry-run is default and reports the planned structural diff without writing files. P3-C does not generate replacement BPMNDI layout and returns `DI_NOT_UPDATED` in `warnings`.

## AddBoundaryEventResult

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

`add-boundary-event` uses the success envelope. Dry-run is default and reports the planned structural diff without writing files. P3-D does not update BPMNDI layout and returns `DI_NOT_UPDATED` in `warnings`.

## Element Type Contract

`type` fields use canonical moddle types such as `bpmn:ServiceTask`. CLI aliases such as `serviceTask` are accepted only as input filters.
