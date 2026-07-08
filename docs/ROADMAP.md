# Roadmap

This file tracks committed implementation phases. Broader product ideas live in `docs/BACKLOG.md`.

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

P2-D implemented:

- `format`

All write commands default to dry-run and require explicit `--write`.

## P3

Structural write commands:

P3-A implemented:

- `insert-task-between`

P3-B implemented:

- `connect`

P3-C implemented:

- `delete-safe`

P3-D implemented:

- `add-boundary-event`

## P4

P4 Sprint 0 implemented:

- adopt `docs/READING_METRICS_STRATEGY.md`
- benchmark fixtures and task definitions
- opt-in CLI metrics logging
- benchmark runner and comparison report
- baseline reading report

Baseline summary:

- 20 benchmark tasks
- 36 CLI calls
- 20 successful tasks
- 8843 estimated output tokens
- 0 XML fallback
- 0 tool errors

Planned measured experiments:

- first measured experiment: enriched `element` details by BPMN element type
- second measured experiment: `context --profile agent`
- semantic experiment: `variables` or `call-activity`
- variable-aware lint rules after variable extraction is stable
- legacy `to-json` deprecation/removal plan
