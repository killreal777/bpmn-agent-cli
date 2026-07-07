# AGENTS.md

## Architecture Rules

- Keep CLI wiring in `src/cli`.
- Keep BPMN loading in `src/bpmn`.
- Keep deterministic indexes in `src/index`.
- Keep pure query use cases in `src/query`.
- Keep diagnostics in `src/validate`.
- Keep output envelope logic in `src/output`.
- Keep legacy converter compatibility in `src/legacy`.

## BPMN Rules

- Use `bpmn-moddle` and `camunda-bpmn-moddle`.
- Do not implement a custom BPMN parser.
- Duplicate id diagnostics are best-effort unless exposed by moddle or visible in indexed elements.
- Do not read full BPMN XML manually when a CLI query answers the question.

## Runtime Rules

- No LLM calls at runtime.
- No network calls during BPMN analysis.
- Do not modify input BPMN files in P0.
- Write only to explicit output paths such as `to-json -o`.
- JSON-mode stdout must contain only JSON.
- Logs and debug output go to stderr.

## Testing

Before completion run:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

Run focused tests while developing:

```bash
npm test -- test/query/findElements.test.ts
npm test -- test/cli/cli.test.ts
```
