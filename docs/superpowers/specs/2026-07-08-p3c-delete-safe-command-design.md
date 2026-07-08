# P3-C Delete Safe Command Design

## Goal

Add a conservative structural delete command:

```bash
bpmn-agent-cli delete-safe process.bpmn --id Task_1
bpmn-agent-cli delete-safe process.bpmn --id Task_1 --replacement-flow-id Flow_Start_To_End --write -o tmp/deleted.bpmn
```

The command removes one safe flow node and reconnects its predecessor to its successor.

## Scope

P3-C supports only the safest linear delete case:

- Target element must be an indexed BPMN flow node.
- Target element must not be a sequence flow, gateway, event, subprocess, call activity, participant, lane, or collaboration element.
- Target element must have exactly one incoming sequence flow and exactly one outgoing sequence flow.
- Incoming flow source and outgoing flow target must exist.
- The command removes:
  - target flow node
  - incoming sequence flow
  - outgoing sequence flow
  - BPMNDI shapes/edges with `bpmnElement` equal to removed ids, when present
- The command adds one replacement sequence flow from incoming source to outgoing target.
- The command updates source `outgoing` and target `incoming` references.

The command does not generate BPMNDI for the replacement flow in P3-C. Successful results include `DI_NOT_UPDATED`.

## CLI Contract

```bash
bpmn-agent-cli delete-safe <file> \
  --id <elementId> \
  [--replacement-flow-id <id>] \
  [--write] \
  [-o <output>] \
  [--pretty]
```

Rules:

- `file` and `--id` are required.
- Default replacement flow id is `<incomingFlowId>_to_<outgoingTargetId>`.
- Replacement flow id must be unique.
- `-o` is allowed only with `--write`.
- Dry-run is default and reports planned diff without writing.

## Result Schema

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

`warnings` includes `DI_NOT_UPDATED` because no replacement BPMNDI edge is generated.

## Error Handling

- Missing `--id`: `INVALID_OPTION_VALUE`, exit `2`.
- `-o` without `--write`: `INVALID_OPTION_VALUE`, exit `2`.
- Unknown element: `ELEMENT_NOT_FOUND`, exit `1`.
- Unsupported element type: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Non-linear element connectivity: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Duplicate replacement flow id: `INVALID_OPTION_VALUE`, exit `2`.
- Required XML section cannot be patched: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Patched XML parse failure: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/deleteSafe.ts`: pure patcher, safety checks, XML edits, result schema.
- `src/cli/commands/deleteSafeCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- `src/cli/main.ts`: route `delete-safe`.

The patcher uses existing deterministic indexes for semantic safety checks and targeted XML edits for the affected source, target, flows, deleted node, and related BPMNDI elements.

## Testing

Focused tests:

- Delete `Task_1` from `simple-linear.bpmn`.
- Patched XML parses with `bpmn-moddle`.
- Removed task and removed flows are absent.
- Replacement flow and source/target references exist.
- `DI_NOT_UPDATED` warning is present.
- Gateways and non-linear nodes are refused.
- CLI dry-run does not modify input.
- CLI `--write -o` writes valid XML.
- CLI rejects `-o` without `--write`.

Full verification before completion:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

