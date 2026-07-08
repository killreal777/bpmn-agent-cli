# P2-A Rename Command Design

## Goal

Add the first safe BPMN write command:

```bash
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review application"
bpmn-agent-cli rename process.bpmn --id Task_1 --name "Review application" --write
```

`rename` updates only the BPMN element `name` attribute for an existing element id. It is dry-run by default and writes only when `--write` is explicitly provided.

## Non-Goals

- No element id changes.
- No structural BPMN edits.
- No layout edits.
- No multi-element bulk rename.
- No raw XML rewrite outside the single target `name` attribute.

## CLI Contract

```bash
bpmn-agent-cli rename <file> --id <elementId> --name <newName> [--write] [-o <output>]
```

Defaults:

- dry-run unless `--write` is present
- when `--write` is present without `-o`, overwrite the input file
- when `--write -o <output>` is present, write to the explicit output path
- when dry-run with `-o`, return `INVALID_OPTION_VALUE`

Validation:

- missing file: `MISSING_FILE_ARGUMENT`, exit `2`
- missing `--id`: `INVALID_OPTION_VALUE`, exit `2`
- missing `--name`: `INVALID_OPTION_VALUE`, exit `2`
- unknown id: `ELEMENT_NOT_FOUND`, exit `1`
- unsupported element type: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`
- output write failure: `OUTPUT_WRITE_ERROR`, exit `1`

## Result Schema

```ts
type RenameResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: {
    name: string | null;
  };
  after: {
    name: string;
  };
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

All success output uses the common JSON envelope.

## Supported Element Types

P2-A supports renaming BPMN elements indexed by `buildIndexes`:

- tasks
- events
- gateways
- subprocess-like elements
- call activities
- sequence flows

It does not rename definitions, processes, collaborations, participants, lanes, or message flows in P2-A.

## XML Update Strategy

Use a constrained string rewrite, not a custom BPMN parser:

1. Load the BPMN through existing `loadBpmn` and `buildIndexes`.
2. Verify the target element exists in indexes.
3. Find the opening XML tag with the target `id`.
4. Replace or add only the `name` attribute on that tag.
5. Parse the updated XML again with `bpmn-moddle`.
6. Verify the target element's name equals the requested value.
7. In dry-run, do not write.
8. In write mode, write only to the input path or explicit `-o`.

The string rewrite must escape XML attribute characters:

- `&` -> `&amp;`
- `"` -> `&quot;`
- `<` -> `&lt;`
- `>` -> `&gt;`

If the target opening tag cannot be found unambiguously, return `UNSUPPORTED_BPMN_ELEMENT_TYPE` in P2-A.

This is intentionally not a general XML parser. It is a constrained patch after moddle validation.

## Architecture

Create:

- `src/write/renameElement.ts`: pure rename planning and XML patching.
- `src/cli/commands/renameCommand.ts`: CLI validation, load/patch/write, envelope.
- `test/write/renameElement.test.ts`: pure rename patch tests.

Modify:

- `src/cli/main.ts`: route `rename`.
- `docs/CLI.md`, `docs/OUTPUT_CONTRACTS.md`, `docs/ROADMAP.md`, `README.md`, skill instructions.

## Safety Rules

- Dry-run is default.
- No write happens without `--write`.
- `-o` is allowed only with `--write`.
- The input file is never modified in dry-run.
- The updated XML must parse successfully before any write.
- JSON stdout must contain only JSON.

## Testing

Use TDD:

- pure tests for replacing existing name, adding missing name, escaping XML attribute values, unknown id, and unsupported tag.
- CLI tests for dry-run, `--write -o`, missing required options, and invalid dry-run `-o`.
- full verification and bundle smoke.

## Acceptance Criteria

- `rename` returns a dry-run JSON envelope by default.
- `rename --write -o <path>` writes renamed XML to the explicit output path.
- `rename --write` can overwrite the input file only when explicitly requested.
- Dry-run never modifies input files.
- Written XML parses through existing BPMN loader.
- Documentation and skill instructions cover write safety.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension` pass.
