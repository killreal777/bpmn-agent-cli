# CLI Reference

Command shape:

```bash
bpmn-agent-cli <command> [file] [options]
```

## overview

```bash
bpmn-agent-cli overview process.bpmn
```

Returns definitions, processes, collaborations, counts, extensions, diagnostics summary and warnings.

## find

```bash
bpmn-agent-cli find process.bpmn --query "loan"
bpmn-agent-cli find process.bpmn --id Task_1
bpmn-agent-cli find process.bpmn --type serviceTask
```

Scores are deterministic: exact id `1.0`, exact normalized name `0.95`, substring name `0.8`, substring id `0.7`, type-only `0.5`.

## element

```bash
bpmn-agent-cli element process.bpmn --id Task_1
```

Returns structural details for a task, gateway, event, subprocess, call activity, or sequence flow.

## context

```bash
bpmn-agent-cli context process.bpmn --id Task_1 --before 2 --after 2
```

Returns local before/after paths. Before paths end with the focus element; after paths start with it.

## trace

```bash
bpmn-agent-cli trace process.bpmn --from Task_1
bpmn-agent-cli trace process.bpmn --from Task_1 --direction backward --depth 5 --max-paths 20
```

Returns cycle-safe control-flow paths.

## path

```bash
bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1
bpmn-agent-cli path process.bpmn --from EndEvent_1 --to StartEvent_1 --direction backward
```

Returns target-reaching control-flow paths between two elements. Defaults are `--direction forward`, `--depth 10`, and `--max-paths 20`.

## gateway

```bash
bpmn-agent-cli gateway process.bpmn --id Gateway_1
```

Returns incoming flows and outgoing branches with conditions.

## implementations

```bash
bpmn-agent-cli implementations process.bpmn
```

Lists Camunda delegates, classes, expressions, external task topics, form keys and call activities.

## participants

```bash
bpmn-agent-cli participants process.bpmn
```

Returns collaborations, participants, message flows, and processes that are not referenced by a participant.

## lanes

```bash
bpmn-agent-cli lanes process.bpmn
bpmn-agent-cli lanes process.bpmn --element Task_1
```

Without `--element`, returns all lanes and an empty `elementLanes` array. With `--element`, returns only lanes containing that element and one element-to-lanes mapping.

## events

```bash
bpmn-agent-cli events process.bpmn
bpmn-agent-cli events process.bpmn --type boundary
```

`--type` accepts `start`, `end`, `boundary`, `intermediate`, and `other`. Event-based gateways are not returned by this command.

## subprocess

```bash
bpmn-agent-cli subprocess process.bpmn
bpmn-agent-cli subprocess process.bpmn --id SubProcess_1
```

Returns subprocess-like elements, direct children, direct nested subprocesses, incoming/outgoing flows, and boundary events.

## export

```bash
bpmn-agent-cli export process.bpmn --format markdown
bpmn-agent-cli export process.bpmn --format text --section overview
bpmn-agent-cli export process.bpmn --format json --section events
bpmn-agent-cli export process.bpmn --format markdown -o tmp/process.md
```

Exports compact BPMN context. `markdown` and `text` successes write raw content. `json` success uses the common JSON envelope. `--section` accepts `all`, `overview`, `participants`, `lanes`, `events`, `subprocess`, and `implementations`.

## rename

```bash
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review"
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review" --write
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review" --write -o tmp/renamed.bpmn
```

Renames one indexed BPMN element. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

## documentation

```bash
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Review"
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Review" --write
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Review" --write -o tmp/documented.bpmn
```

Adds or replaces one `bpmn:documentation` child for an indexed BPMN element. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

## implementation

```bash
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind delegateExpression --value '${serviceDelegate}'
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind externalTask --value score-client --write
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind externalTask --value score-client --write -o tmp/implemented.bpmn
```

Sets one supported implementation attribute group on an indexed BPMN element. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

Supported `--kind` values are `delegateExpression`, `class`, `expression`, `externalTask`, `form`, and `callActivity`. `externalTask` writes `camunda:type="external"` and `camunda:topic="<value>"`; other kinds write one attribute.

## format

```bash
bpmn-agent-cli format process.bpmn
bpmn-agent-cli format process.bpmn --write
bpmn-agent-cli format process.bpmn --write -o tmp/formatted.bpmn
```

Formats BPMN XML by parsing with `bpmn-moddle` and serializing the model with formatting enabled. Dry-run is the default and reports byte counts plus whether serialized XML differs from input. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

## insert-task-between

```bash
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review"
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review" --type userTask --write
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review" --type serviceTask --write -o tmp/inserted.bpmn
```

Splits one existing `bpmn:SequenceFlow` and inserts one task-like node between the original source and target. `--type` accepts `task`, `userTask`, and `serviceTask`; default is `task`. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

P3-A updates semantic BPMN only and does not update BPMNDI layout. Successful results include a `DI_NOT_UPDATED` warning.

## connect

```bash
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B --name "approved" --write
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B --write -o tmp/connected.bpmn
```

Adds one `bpmn:SequenceFlow` between two existing flow nodes and updates source `outgoing` plus target `incoming` references. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

P3-B updates semantic BPMN only and does not update BPMNDI layout. Successful results include a `DI_NOT_UPDATED` warning.

## delete-safe

```bash
bpmn-agent-cli delete-safe process.bpmn --id Task_1
bpmn-agent-cli delete-safe process.bpmn --id Task_1 --replacement-flow-id Flow_Start_To_End --write
bpmn-agent-cli delete-safe process.bpmn --id Task_1 --write -o tmp/deleted.bpmn
```

Deletes one safe linear flow node with exactly one incoming and one outgoing sequence flow, then reconnects predecessor to successor with one replacement sequence flow. Dry-run is the default. No file is written unless `--write` is provided. `-o` is allowed only with `--write`.

P3-C refuses gateways, events, subprocess-like nodes, call activities, sequence flows, and nodes with non-linear connectivity. It removes BPMNDI entries that explicitly referenced deleted ids, but does not generate layout for the replacement flow, so successful results include `DI_NOT_UPDATED`.

## validate

```bash
bpmn-agent-cli validate process.bpmn
```

Returns `valid`, `errors`, `warnings`, and `infos`. Validation errors exit with code `1`; parse errors exit with code `4`.

## to-json

```bash
bpmn-agent-cli to-json process.bpmn --preset optimized
bpmn-agent-cli to-json process.bpmn -o tmp/process.json
bpmn-agent-cli to-json --print-config optimized
```

Legacy command. Successful output is raw converter JSON, not the common success envelope.
