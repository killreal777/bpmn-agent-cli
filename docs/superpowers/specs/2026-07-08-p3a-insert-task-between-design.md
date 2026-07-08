# P3-A Insert Task Between Design

## Goal

Add the first structural write command:

```bash
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review" --type userTask
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review" --type userTask --write -o tmp/inserted.bpmn
```

The command splits one existing `bpmn:SequenceFlow` and inserts one task-like flow node between the original source and target.

## Scope

P3-A supports semantic BPMN only:

- Locate an existing `bpmn:SequenceFlow` by `--flow`.
- Insert a new task-like element in the same XML container as that sequence flow.
- Replace the original flow with two sequence flows:
  - original source -> new task
  - new task -> original target
- Update source element outgoing references, target element incoming references, and new task incoming/outgoing references.
- Validate the patched XML with `bpmn-moddle`.

P3-A does not generate or update BPMNDI shapes/edges. The result includes a warning with code `DI_NOT_UPDATED`. Visual layout generation is P3-B/P4.

## CLI Contract

```bash
bpmn-agent-cli insert-task-between <file> \
  --flow <sequenceFlowId> \
  --id <newElementId> \
  --name <newElementName> \
  [--type task|userTask|serviceTask] \
  [--incoming-flow-id <id>] \
  [--outgoing-flow-id <id>] \
  [--write] \
  [-o <output>] \
  [--pretty]
```

Rules:

- `file`, `--flow`, `--id`, and `--name` are required.
- `--type` defaults to `task`.
- `--type` maps to `bpmn:task`, `bpmn:userTask`, or `bpmn:serviceTask`.
- Default incoming flow id is `<flow>_to_<id>`.
- Default outgoing flow id is `<id>_to_<oldTargetId>`.
- New element id and new flow ids must not already exist in `indexes.byId` or `indexes.sequenceFlowById`.
- `-o` is allowed only with `--write`.
- Dry-run is default and reports the planned structural diff without writing.

## Result Schema

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

`warnings` always includes:

```json
{
  "severity": "warning",
  "code": "DI_NOT_UPDATED",
  "message": "BPMNDI layout is not updated in P3-A"
}
```

## Error Handling

- Missing required args: `INVALID_OPTION_VALUE`, exit `2`.
- Unsupported `--type`: `INVALID_OPTION_VALUE`, exit `2`.
- `-o` without `--write`: `INVALID_OPTION_VALUE`, exit `2`.
- Unknown flow id: `REFERENCE_NOT_FOUND`, exit `1`.
- Duplicate new ids: `INVALID_OPTION_VALUE`, exit `2`.
- Source/target opening or closing tag cannot be patched: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Patched XML parse failure: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/insertTaskBetween.ts`: pure XML patcher and result construction.
- `src/cli/commands/insertTaskBetweenCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- `src/cli/main.ts`: route `insert-task-between`.

The patcher uses existing indexes for semantic validation and targeted XML edits for the affected source node, target node, and sequence flow. It does not parse full BPMN XML manually and does not read project files beyond the input BPMN.

## Testing

Focused tests:

- Pure patcher splits `Flow_Start_To_Task` in `simple-linear.bpmn`.
- Patched XML parses with `bpmn-moddle`.
- Result includes `DI_NOT_UPDATED`.
- Duplicate new id is rejected.
- Unsupported type is rejected.
- CLI dry-run does not modify input.
- CLI `--write -o` writes valid output.
- CLI rejects `-o` without `--write`.

Full verification before completion:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

