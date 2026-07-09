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
- full JSON conversion through `to-json`

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
- agent-executed benchmark runner with Codex preset and custom agent command support

Baseline summary:

- 20 benchmark tasks
- 36 CLI calls
- 20 successful tasks
- 8843 estimated output tokens
- 0 XML fallback
- 0 tool errors

Planned measured experiments:

- first measured experiment implemented: enriched `element` details by BPMN element type
  - success unchanged: 20/20 tasks
  - CLI calls unchanged: 36
  - estimated output tokens increased by 424 because details are additive
  - accepted as correctness-enabling; next benchmark iteration should score correctness or adaptive follow-up-call reduction
- semantic experiment implemented: `variables`
  - success unchanged: 20/20 tasks
  - CLI calls improved: 36 -> 35
  - estimated output tokens increased by 1223 because full variable usages and mappings are additive
  - accepted as correctness-enabling; future compact/profile output should control token cost
- semantic experiment implemented: `call-activity`
  - focused CallActivity contract reader for called element, variable mappings, pass-through, business key, and warnings
  - shares extraction with `element.details` and `variables`
  - success unchanged: 20/20 tasks
  - CLI calls improved: 36 -> 34
  - estimated output tokens increased by 1159 because the command returns a richer contract card
- measured experiment implemented: `context --profile agent`
  - default full context remains unchanged
  - agent profile returns compact ids for paths and immediate neighbors
  - success unchanged: 20/20 tasks
  - estimated output tokens improved by 92 compared with `candidate-call-activity`
- variable-aware lint rules implemented as warnings-only `validate` diagnostics
- JSON conversion modernization implemented: `to-json` remains supported and active converter code lives under `src/convert`
- semantic `diff` implemented for comparing two BPMN files by indexed model changes
