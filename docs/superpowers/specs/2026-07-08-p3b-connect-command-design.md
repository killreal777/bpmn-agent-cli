# P3-B Connect Command Design

## Goal

Add a structural command for connecting two existing flow nodes:

```bash
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B --name "approved" --write -o tmp/connected.bpmn
```

The command creates one `bpmn:SequenceFlow`, appends an outgoing reference to the source node, appends an incoming reference to the target node, and validates the patched BPMN XML before writing.

## Scope

P3-B supports semantic BPMN only:

- `--from` and `--to` must reference existing indexed BPMN flow nodes.
- `--id` must be new and unique.
- The new sequence flow is inserted in the same XML container as the source node when possible.
- The source node receives `<bpmn:outgoing>flowId</bpmn:outgoing>`.
- The target node receives `<bpmn:incoming>flowId</bpmn:incoming>`.
- Optional `--name` adds a sequence flow `name` attribute.

P3-B does not update BPMNDI and returns `DI_NOT_UPDATED`. Conditional flow expressions are out of scope. Gateway-specific semantic validation is P3-C/P4.

## CLI Contract

```bash
bpmn-agent-cli connect <file> \
  --from <sourceElementId> \
  --to <targetElementId> \
  --id <sequenceFlowId> \
  [--name <sequenceFlowName>] \
  [--write] \
  [-o <output>] \
  [--pretty]
```

Rules:

- `file`, `--from`, `--to`, and `--id` are required.
- `--id` must not exist in `indexes.byId` or `indexes.sequenceFlowById`.
- `--from` and `--to` must not be sequence flows.
- `-o` is allowed only with `--write`.
- Dry-run is default and reports the planned diff without writing.

## Result Schema

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

`warnings` always includes `DI_NOT_UPDATED`.

## Error Handling

- Missing required args: `INVALID_OPTION_VALUE`, exit `2`.
- Duplicate flow id: `INVALID_OPTION_VALUE`, exit `2`.
- Unknown source/target id: `ELEMENT_NOT_FOUND`, exit `1`.
- Source/target is not a flow node: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Source/target XML cannot be patched: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Patched XML parse failure: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/connectElements.ts`: pure XML patcher and result construction.
- `src/cli/commands/connectCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- `src/cli/main.ts`: route `connect`.

The implementation reuses the structural write style from `insert-task-between`: targeted XML edits guarded by existing indexes and moddle validation.

## Testing

Focused tests:

- Pure patcher connects `StartEvent_1` to `EndEvent_1` in `simple-linear.bpmn`.
- Patched XML parses.
- Result includes `DI_NOT_UPDATED`.
- Duplicate flow id and sequence-flow endpoints are rejected.
- CLI dry-run does not modify input.
- CLI `--write -o` writes valid output.
- CLI rejects `-o` without `--write`.

Full verification:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

