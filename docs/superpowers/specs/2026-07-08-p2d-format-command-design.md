# P2-D Format Command Design

## Goal

Add a safe write command that formats BPMN XML through the existing moddle model:

```bash
bpmn-agent-cli format process.bpmn
bpmn-agent-cli format process.bpmn --write
bpmn-agent-cli format process.bpmn --write -o tmp/formatted.bpmn
```

The command is dry-run by default and follows the P2 write contract used by `rename`, `documentation`, and `implementation`.

## Scope

P2-D `format` is a model-based formatter, not a custom XML pretty-printer. It loads BPMN with `bpmn-moddle` plus the Camunda descriptor and serializes `definitions` with:

```ts
await moddle.toXML(definitions, { format: true });
```

This keeps the implementation inside the existing BPMN parser/serializer stack and avoids a second XML parser. The command may normalize XML layout, namespace placement, and attribute ordering according to `moddle-xml`. It must validate that the formatted XML parses before writing.

## CLI Contract

```bash
bpmn-agent-cli format <file> [--write] [-o <output>] [--pretty]
```

Rules:

- `file` is required.
- `-o` is allowed only with `--write`.
- Without `--write`, stdout contains only the common JSON envelope and no file is written.
- With `--write` and no `-o`, the command overwrites the input file after formatted XML validates.
- With `--write -o`, the command writes only to the explicit output path.

## Result Schema

```ts
type FormatResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  changed: boolean;
  before: {
    bytes: number;
  };
  after: {
    bytes: number;
  };
  diagnostics: {
    warnings: Array<{ message: string }>;
  };
};
```

`changed` is `true` when the serialized XML differs byte-for-byte from the input XML. The formatted XML is not printed to stdout in P2-D because JSON-mode stdout must contain only JSON and large XML payloads are not agent-friendly.

## Error Handling

- Missing file: `MISSING_FILE_ARGUMENT`, exit `2`.
- `-o` without `--write`: `INVALID_OPTION_VALUE`, exit `2`.
- Input read errors and parse errors use existing `loadBpmn` errors.
- Formatted XML parse failure: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/formatBpmn.ts`: pure async formatter over an already loaded BPMN model.
- `src/cli/commands/formatCommand.ts`: CLI validation, formatting, validation, optional write, envelope creation.
- `src/cli/main.ts`: route `format`.
- Docs and skill describe dry-run-first formatting.

## Testing

Focused tests:

- `formatBpmnModel` returns formatted XML that parses and reports `changed`.
- CLI dry-run does not modify the input file.
- CLI `--write -o` writes formatted XML that validates.
- CLI rejects `-o` without `--write`.
- Docs mention command and `FormatResult`.

Full verification before completion:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

