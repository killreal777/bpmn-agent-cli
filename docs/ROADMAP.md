# Roadmap

## P0

Read-only MVP:

- `overview`
- `find`
- `element`
- `context`
- `trace`
- `gateway`
- `implementations`
- `validate`
- legacy `to-json`

Distribution:

- Qwen extension metadata
- Claude plugin metadata
- bundled `dist/extension/bpmn-agent-cli.cjs`
- BPMN agent skill
- command file

## P1

P1-A implemented:

- `events`
- `subprocess`
- `participants`
- `lanes`

P1-B implemented:

- `path`

P1-C implemented:

- `export`
- markdown/text output for `export`

Remaining reading improvements:

- full duplicate id detection if supported without custom parsing

## P2

P2-A implemented:

- `rename`

P2-B implemented:

- `documentation`

P2-C implemented:

- `implementation`

Remaining safe write commands:

- `format`

All write commands default to dry-run and require explicit `--write`.

## P3

Structural write commands:

- `insert-task-between`
- `connect`
- `delete-safe`
- `add-boundary-event`
