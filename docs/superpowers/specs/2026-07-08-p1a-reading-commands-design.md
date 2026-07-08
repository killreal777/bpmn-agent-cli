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

When `--element <id>` is provided, `lanes` includes only lanes containing that element and `elementLanes` contains one entry for the requested element. Unknown element ids return `ELEMENT_NOT_FOUND`.

### EventsResult

```ts
type EventsResult = {
  events: Array<EventSummary & {
    category: "start" | "end" | "boundary" | "intermediate" | "other";
    attachedTo?: ElementSummary | null;
    outgoing: SequenceFlowSummary[];
    incoming: SequenceFlowSummary[];
  }>;
};
```

`--type` accepts `start`, `end`, `boundary`, `intermediate`, and `other`. Invalid values return `INVALID_OPTION_VALUE`.

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

P1-A may add:

```ts
lanesById: Map<string, LaneSummary>
subprocessParentByChildId: Map<string, string>
```

Only add these if tests show they reduce query complexity without making the model inconsistent.

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
