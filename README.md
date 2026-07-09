# bpmn-agent-cli

Agent-friendly local CLI for reading and validating BPMN 2.0 files without forcing agents to inspect full BPMN XML.

The tool is deterministic and local:

- no runtime LLM calls
- no runtime network calls during BPMN analysis
- JSON output by default
- machine-readable errors
- full BPMN-to-JSON conversion through `to-json`

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run build:extension
```

Run from source:

```bash
npm run start -- overview process.bpmn --pretty
```

Run the built CLI:

```bash
node dist/cli/main.js overview process.bpmn --pretty
```

## CLI Examples

```bash
bpmn-agent-cli overview process.bpmn
bpmn-agent-cli find process.bpmn --query "loan"
bpmn-agent-cli element process.bpmn --id Activity_CheckClient
bpmn-agent-cli context process.bpmn --id Activity_CheckClient
bpmn-agent-cli context process.bpmn --id Activity_CheckClient --profile agent
bpmn-agent-cli trace process.bpmn --from Activity_CheckClient
bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1
bpmn-agent-cli gateway process.bpmn --id Gateway_CheckResult
bpmn-agent-cli implementations process.bpmn
bpmn-agent-cli participants process.bpmn
bpmn-agent-cli call-activity process.bpmn --id Call_SubProcess
bpmn-agent-cli diff --base before.bpmn --candidate after.bpmn
bpmn-agent-cli impact process.bpmn --id Activity_CheckClient
bpmn-agent-cli review process.bpmn
bpmn-agent-cli lanes process.bpmn --element Activity_CheckClient
bpmn-agent-cli events process.bpmn --type boundary
bpmn-agent-cli subprocess process.bpmn --id SubProcess_1
bpmn-agent-cli export process.bpmn --format markdown
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review"
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Review"
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind delegateExpression --value '${serviceDelegate}'
bpmn-agent-cli format process.bpmn --write -o tmp/formatted.bpmn
bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review"
bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B
bpmn-agent-cli delete-safe process.bpmn --id Task_1
bpmn-agent-cli add-boundary-event process.bpmn --attached-to Task_1 --id Boundary_Timeout --target EndEvent_1 --flow-id Flow_Timeout_To_End --duration PT10M
bpmn-agent-cli validate process.bpmn
bpmn-agent-cli to-json process.bpmn --preset optimized
```

All query commands return a JSON envelope. The `to-json` command returns the converted JSON document directly because the command result is the JSON export itself.

## Qwen Code Install

Target install command:

```text
/extensions install https://github.com/killreal777/bpmn-agent-cli
```

CLI equivalent:

```bash
qwen extensions install https://github.com/killreal777/bpmn-agent-cli
```

The extension uses `qwen-extension.json`, `QWEN.md`, `commands/`, `skills/`, and the committed bundle at `dist/extension/bpmn-agent-cli.cjs`.

## Claude Code Install

Marketplace flow:

```text
/plugin marketplace add killreal777/bpmn-agent-cli
/plugin install bpmn-agent-cli@bpmn-agent-tools
```

CLI equivalent:

```bash
claude plugin marketplace add killreal777/bpmn-agent-cli
claude plugin install bpmn-agent-cli@bpmn-agent-tools
```

Validate when Claude Code is available:

```bash
claude plugin validate .
```

## MVP Status

P0 includes read-only commands: `overview`, `find`, `element`, `context`, `trace`, `gateway`, `implementations`, `validate`, plus full JSON conversion through `to-json`.

P1-A adds read-only structural commands: `participants`, `lanes`, `events`, and `subprocess`.

P1-B adds `path` for focused reachability between two BPMN elements.

P1-C adds `export` for markdown, text, and JSON context output.

P2-A adds safe `rename` with dry-run default and explicit `--write`.

P2-B adds safe `documentation` updates with dry-run default and explicit `--write`.

P2-C adds safe `implementation` updates for supported top-level runtime attributes with dry-run default and explicit `--write`.

P2-D adds safe model-based BPMN XML `format` with dry-run default and explicit `--write`.

P3-A adds structural `insert-task-between` for splitting one sequence flow and inserting one task-like node. BPMNDI layout is not updated in P3-A.

P3-B adds structural `connect` for adding one sequence flow between existing nodes. BPMNDI layout is not updated in P3-B.

P3-C adds structural `delete-safe` for removing one linear flow node and reconnecting source to target. BPMNDI layout is not updated in P3-C.

P3-D adds structural `add-boundary-event` for timer boundary events. BPMNDI layout is not updated in P3-D.

P4 adds semantic reading and review-confidence features including `variables`, `call-activity`, `context --profile agent`, variable-aware validate warnings, `diff`, `impact`, `review`, and BPMN lint diagnostics.

Product direction is documented in `docs/PRODUCT_VISION.md`. P1/P2/P3 status is documented in `docs/ROADMAP.md`. Future ideas are tracked in `docs/BACKLOG.md`.

## JSON Conversion

`to-json` converts BPMN XML into a compact JSON document for integrations, debugging, and workflows that need a full model export. Focused commands such as `overview`, `element`, `variables`, and `call-activity` are preferred when an agent needs a specific answer instead of a complete JSON export.
