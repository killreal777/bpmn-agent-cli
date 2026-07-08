# P2-B Documentation Command Design

## Goal

Add a safe write command for BPMN documentation text:

```bash
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Checks the application data."
bpmn-agent-cli documentation process.bpmn --id Task_1 --text "Checks the application data." --write
```

The command adds or replaces a single `bpmn:documentation` child for one supported BPMN element. It is dry-run by default and writes only with explicit `--write`.

## Non-Goals

- No multi-documentation editing.
- No documentation deletion in P2-B.
- No bulk updates.
- No structural flow edits.
- No LLM-generated documentation.

## CLI Contract

```bash
bpmn-agent-cli documentation <file> --id <elementId> --text <documentationText> [--write] [-o <output>]
```

Defaults and write rules match `rename`:

- dry-run unless `--write` is present
- `--write` without `-o` overwrites input
- `--write -o <output>` writes to explicit output path
- dry-run with `-o` returns `INVALID_OPTION_VALUE`

## Result Schema

```ts
type DocumentationResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  before: {
    documentation: string | null;
  };
  after: {
    documentation: string;
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

## XML Update Strategy

Use the same constrained strategy as `rename`:

1. Load BPMN with existing loader and indexes.
2. Verify target exists.
3. Locate the target opening and closing tag.
4. Replace the first direct `bpmn:documentation` child if present.
5. Otherwise add `<bpmn:documentation>...</bpmn:documentation>` as the first child.
6. Escape XML text content:
   - `&` -> `&amp;`
   - `<` -> `&lt;`
   - `>` -> `&gt;`
7. Parse patched XML through moddle before writing.

Self-closing target tags are expanded:

```xml
<bpmn:task id="Task_1" />
```

becomes:

```xml
<bpmn:task id="Task_1">
  <bpmn:documentation>...</bpmn:documentation>
</bpmn:task>
```

If the target tag cannot be found unambiguously, return `UNSUPPORTED_BPMN_ELEMENT_TYPE`.

## Safety Rules

- Dry-run is default.
- No write without `--write`.
- `-o` only with `--write`.
- Patched XML must parse before writing.
- JSON stdout must contain only JSON.

## Architecture

Create:

- `src/write/documentElement.ts`
- `src/cli/commands/documentationCommand.ts`
- `test/write/documentElement.test.ts`

Modify:

- `src/cli/main.ts`
- docs and skill files

## Testing

Use TDD:

- pure tests for adding documentation to self-closing element
- pure tests for replacing existing documentation
- pure tests for escaping XML text
- CLI dry-run test
- CLI `--write -o` test
- docs test
- final verification and bundle smoke

## Acceptance Criteria

- `documentation` dry-run reports planned change without writing.
- `documentation --write -o <path>` writes parseable BPMN XML.
- Existing documentation is replaced deterministically.
- Documentation text is XML-escaped.
- Docs and skill instructions cover safety rules.
- Full verification and bundle smoke pass.
