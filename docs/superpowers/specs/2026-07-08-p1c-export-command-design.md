# P1-C Export Command Design

## Goal

Add a read-only `export` command that produces compact agent context from BPMN files in `markdown`, `text`, or `json`:

```bash
bpmn-agent-cli export process.bpmn --format markdown
bpmn-agent-cli export process.bpmn --format text --section overview
bpmn-agent-cli export process.bpmn --format json --section events
```

This command is for sharing BPMN context with humans or agents without requiring raw XML inspection.

## Non-Goals

- No BPMN mutation.
- No diagram rendering.
- No HTML/PDF export.
- No custom BPMN parser.
- No command-specific LLM calls.

## CLI Contract

```bash
bpmn-agent-cli export <file> [--format markdown|text|json] [--section all|overview|participants|lanes|events|subprocess|implementations] [-o <output>]
```

Defaults:

- `--format markdown`
- `--section all`

Successful output:

- `markdown` and `text` write raw export content, not a JSON envelope.
- `json` writes the existing success envelope with `ExportResult`.
- `-o` writes the successful export payload to the explicit output path instead of stdout.
- Errors always use the existing JSON error envelope on stdout.

`export` does not modify input BPMN files.

## Result Model

```ts
type ExportSection =
  | "overview"
  | "participants"
  | "lanes"
  | "events"
  | "subprocess"
  | "implementations";

type ExportResult = {
  format: "json";
  sections: ExportSection[];
  overview?: OverviewResult;
  participants?: ParticipantsResult;
  lanes?: LanesResult;
  events?: EventsResult;
  subprocess?: SubprocessResult;
  implementations?: ImplementationsResult;
};
```

For `markdown` and `text`, the same section data is rendered into a compact deterministic document.

## Section Semantics

- `overview`: definitions, process/collaboration summaries, counts, diagnostics summary.
- `participants`: collaborations, participants, and message flows.
- `lanes`: all lanes and their direct flow nodes.
- `events`: events with categories and event definition summaries.
- `subprocess`: subprocess-like elements with direct children and boundary events.
- `implementations`: Camunda delegates, expressions, external topics, forms, call activities, and listeners.
- `all`: all sections in the order above.

## Formatting Rules

Markdown:

- Begin with `# BPMN Export`.
- Use `##` headings per section.
- Use compact bullets.
- Keep IDs visible.
- Do not include raw XML.

Text:

- Begin with `BPMN Export`.
- Use uppercase section labels.
- Use compact line-based summaries.
- Do not include raw XML.

JSON:

- Use success envelope.
- Use existing query result shapes.

## Architecture

Create:

- `src/query/exportModel.ts`: builds `ExportResult` section data.
- `src/export/renderMarkdown.ts`: renders `ExportResult` to Markdown.
- `src/export/renderText.ts`: renders `ExportResult` to plain text.
- `src/cli/commands/exportCommand.ts`: parses options, loads BPMN, writes stdout or `-o`.

Modify:

- `src/cli/main.ts`: route `export`.
- `src/output` only if a small write helper is required.

Use existing query functions:

- `getOverview`
- `getParticipants`
- `getLanes`
- `getEvents`
- `getSubprocesses`
- `getImplementations`

## Error Handling

- missing file: `MISSING_FILE_ARGUMENT`, exit `2`
- invalid `--format`: `INVALID_OPTION_VALUE`, exit `2`
- invalid `--section`: `INVALID_OPTION_VALUE`, exit `2`
- output write failure: `OUTPUT_WRITE_ERROR`, exit `1`

## Testing

Use TDD:

- pure export model tests for section selection.
- renderer tests for deterministic markdown/text content.
- CLI tests for markdown stdout, JSON envelope, and `-o`.
- docs tests for command and `ExportResult`.
- final full verification and bundle smoke.

## Acceptance Criteria

- `export` supports `markdown`, `text`, and `json`.
- `export --format json` returns a JSON envelope.
- `export --format markdown` and `text` return raw content on stdout.
- `export -o <path>` writes only to explicit output paths.
- Errors remain JSON envelopes.
- Documentation and skill instructions include `export`.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension` pass.
