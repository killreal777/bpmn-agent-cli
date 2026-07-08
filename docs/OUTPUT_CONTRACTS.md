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

## Element Type Contract

`type` fields use canonical moddle types such as `bpmn:ServiceTask`. CLI aliases such as `serviceTask` are accepted only as input filters.
