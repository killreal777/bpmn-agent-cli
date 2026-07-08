# P1-A Reading Commands Design

## Goal

Add four read-only BPMN query commands to improve structural understanding without expanding P0 write scope:

- `participants`
- `lanes`
- `events`
- `subprocess`

P1-A keeps the P0 JSON envelope contract. Markdown/text output and the `path` command remain outside this slice.

## Non-Goals

- No BPMN XML rewriting.
- No custom BPMN parser.
- No markdown/text output.
- No cross-process pathfinding.
- No mutation commands.

## CLI Contract

Command shape remains:

```bash
bpmn-agent-cli <command> <file> [options]
```

New commands:

```bash
bpmn-agent-cli participants process.bpmn
bpmn-agent-cli lanes process.bpmn
bpmn-agent-cli lanes process.bpmn --element Task_1
bpmn-agent-cli events process.bpmn
bpmn-agent-cli events process.bpmn --type boundary
bpmn-agent-cli subprocess process.bpmn
bpmn-agent-cli subprocess process.bpmn --id SubProcess_1
```

All successful command output uses the existing success envelope:

```json
{
  "ok": true,
  "command": "participants",
  "file": "process.bpmn",
  "result": {}
}
```

## Result Schemas

### ParticipantsResult

```ts
type ParticipantsResult = {
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: ParticipantSummary[];
    messageFlows: MessageFlowSummary[];
  }>;
  unreferencedProcesses: Array<{
    id: string;
    name: string | null;
  }>;
};
```

`unreferencedProcesses` contains processes that are not referenced by any collaboration participant.

### LanesResult

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

Without `--element`:

- `lanes` contains all lanes, including lanes without `flowNodeRef` values.
- `elementLanes` is an empty array.

With `--element <id>`:

- `lanes` contains only lanes containing the requested element.
- `elementLanes` contains exactly one entry for the requested element.
- unknown element ids return `ELEMENT_NOT_FOUND`.

### EventsResult

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

`--type` accepts `start`, `end`, `boundary`, `intermediate`, and `other`. Invalid values return `INVALID_OPTION_VALUE`.

Event category mapping:

- `start`: `bpmn:StartEvent`
- `end`: `bpmn:EndEvent`
- `boundary`: `bpmn:BoundaryEvent`
- `intermediate`: `bpmn:IntermediateCatchEvent` and `bpmn:IntermediateThrowEvent`
- `other`: event-like elements not covered by the categories above

`bpmn:EventBasedGateway` is a gateway, not an event, and must not appear in `events`.

`eventDefinitions` contains one entry per BPMN event definition where available. The `type` field is the canonical moddle type, for example `bpmn:TimerEventDefinition` or `bpmn:MessageEventDefinition`. `value` is used for direct timer/expression text when trivially available from moddle. `refId` and `refName` are used for referenced definitions such as message, error, signal, or escalation references.

### SubprocessResult

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

When `--id <id>` is provided, the command returns only that subprocess. Unknown ids return `ELEMENT_NOT_FOUND`. Existing non-subprocess ids return `UNSUPPORTED_BPMN_ELEMENT_TYPE`.

Supported subprocess-like types in P1-A:

- `bpmn:SubProcess`
- `bpmn:AdHocSubProcess`
- `bpmn:Transaction`

`children` contains direct children only. `nestedSubprocesses` contains direct child subprocess-like elements only. Recursive subtree export is outside P1-A.

## Architecture

Follow the existing P0 layers:

- CLI dispatch stays in `src/cli/main.ts`.
- Command wrappers live in `src/cli/commands`.
- Pure query logic lives in `src/query`.
- Deterministic index support stays in `src/index/buildIndexes.ts`.
- Shared BPMN summary types stay in `src/bpmn/types.ts`.
- Output envelope logic stays unchanged in `src/output`.

P1-A should extend indexes only where existing indexes cannot answer the query deterministically. It should not read raw XML beyond the existing `loadBpmn` behavior.

## Index Requirements

Existing indexes already cover many needs:

- `byId`
- `byProcessId`
- `incomingByNodeId`
- `outgoingByNodeId`
- `boundaryEventsByAttachedToId`
- `childrenBySubprocessId`
- `participantByProcessId`
- `lanesByElementId`
- `messageFlowById`

P1-A must add:

```ts
lanesById: Map<string, LaneSummary>
lanesByProcessId: Map<string, LaneSummary[]>
subprocessParentByChildId: Map<string, string>
```

`lanesById` and `lanesByProcessId` are required so `lanes` can return all lanes, including empty lanes. `subprocessParentByChildId` is required because `SubprocessResult.parentSubprocessId` is part of the stable result schema.

## Ordering

All arrays must be deterministic:

- primary sort by id ascending
- for nested structures, sort parent objects first, then nested arrays by id ascending
- message flows and sequence flows sort by id ascending

## Error Handling

Use existing error envelope behavior.

Required errors:

- missing file: `MISSING_FILE_ARGUMENT`, exit `2`
- unknown command option values: `INVALID_OPTION_VALUE`, exit `2`
- missing element id: `ELEMENT_NOT_FOUND`, exit `1`
- `subprocess --id` on a non-subprocess element: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`

## Documentation

Update:

- `docs/CLI.md`
- `docs/OUTPUT_CONTRACTS.md`
- `docs/ROADMAP.md`
- `README.md` if command examples are expanded
- `skills/bpmn-agent-cli/SKILL.md` so agents know when to use the new commands

## Testing

Use TDD for every command:

- query tests for pure result shape and filtering
- CLI tests for envelope, options, and error codes
- docs tests for command documentation
- typecheck and build verification

Fixtures should reuse existing BPMN examples where possible. Add the smallest new fixture only if existing files do not contain participants, lanes, events, and subprocesses needed for deterministic tests.

## Acceptance Criteria

- `participants`, `lanes`, `events`, and `subprocess` are available from the CLI.
- All new commands return JSON envelopes on success.
- All new commands preserve JSON-only stdout.
- `events --type` validates supported values.
- `lanes --element` filters lane data to the requested element.
- `subprocess --id` distinguishes not found from wrong element type.
- Documentation and skill instructions include the new commands.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension` pass.
