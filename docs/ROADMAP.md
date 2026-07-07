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

Reading improvements:

- `path`
- `events`
- `subprocess`
- `participants`
- `lanes`
- `export`
- markdown/text output where useful
- full duplicate id detection if supported without custom parsing

## P2

Safe write commands:

- `rename`
- `documentation`
- `implementation`
- `format`

All write commands default to dry-run and require explicit `--write`.

## P3

Structural write commands:

- `insert-task-between`
- `connect`
- `delete-safe`
- `add-boundary-event`
