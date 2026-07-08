# P2-C Implementation Command Design

## Goal

Add a safe write command for changing one runtime implementation setting on one BPMN element:

```bash
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind delegateExpression --value '${serviceDelegate}'
bpmn-agent-cli implementation process.bpmn --id Service_1 --kind externalTask --value score-client --write -o tmp/implemented.bpmn
```

The command follows the P2 write model already used by `rename` and `documentation`: dry-run by default, explicit `--write` for file output, common JSON envelope for successes and errors, and validation of patched BPMN XML before writing.

## Scope

P2-C supports only attributes that can be patched safely on the element opening tag:

- `delegateExpression` -> `camunda:delegateExpression`
- `class` -> `camunda:class`
- `expression` -> `camunda:expression`
- `externalTask` -> `camunda:type="external"` and `camunda:topic="<value>"`
- `form` -> `camunda:formKey`
- `callActivity` -> `calledElement`

The command does not create or modify `extensionElements`, execution listeners, task listeners, field injection, input/output mappings, or connector payloads. Those require structural XML edits and are outside P2-C.

## CLI Contract

```bash
bpmn-agent-cli implementation <file> --id <elementId> --kind <kind> --value <value> [--write] [-o <output>] [--pretty]
```

Rules:

- `--id`, `--kind`, and `--value` are required.
- `--kind` must be one of the supported P2-C kinds.
- `-o` is allowed only with `--write`.
- Without `--write`, the command returns the planned diff and does not write any file.
- With `--write` and no `-o`, the command overwrites the input file after patched XML validates.
- If a `camunda:*` attribute is added to a BPMN file that lacks `xmlns:camunda`, the command adds `xmlns:camunda="http://camunda.org/schema/1.0/bpmn"` to `bpmn:definitions`.

## Result Schema

```ts
type ImplementationPatchResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  element: ElementSummary;
  kind: "delegateExpression" | "class" | "expression" | "externalTask" | "form" | "callActivity";
  before: Record<string, string | null>;
  after: Record<string, string>;
  diff: Array<{
    op: "replace" | "add";
    path: string;
    before: string | null;
    after: string;
  }>;
};
```

For `externalTask`, the diff includes both `/elements/<id>/camunda:type` and `/elements/<id>/camunda:topic`. Other kinds include exactly one diff entry.

## Error Handling

- Unknown element id: `ELEMENT_NOT_FOUND`, exit `1`.
- Unsupported kind: `INVALID_OPTION_VALUE`, exit `2`.
- Missing required args: `INVALID_OPTION_VALUE`, exit `2`.
- `-o` without `--write`: `INVALID_OPTION_VALUE`, exit `2`.
- Target opening tag cannot be found: `UNSUPPORTED_BPMN_ELEMENT_TYPE`, exit `1`.
- Patched XML does not parse: `BPMN_PARSE_ERROR`, exit `4`.
- Output write failure: `OUTPUT_WRITE_ERROR`, exit `1`.

## Architecture

- `src/write/implementationElement.ts` contains the pure XML patcher and result construction.
- `src/cli/commands/implementationCommand.ts` handles CLI validation, loading, indexing, patched XML validation, optional write, and envelope creation.
- `src/cli/main.ts` routes `implementation`.
- Docs and skill describe dry-run-first usage.

The pure patcher follows the existing `renameElementXml` and `documentElementXml` pattern: it uses `indexes.byId` for target validation, patches only the XML opening tag for the target id, escapes XML attribute values, and returns a deterministic diff.

## Testing

Focused tests:

- Pure write tests for replacing existing delegateExpression.
- Pure write tests for adding Camunda namespace and formKey to a file without Camunda namespace.
- Pure write tests for external task updating both type and topic.
- Pure write tests for unknown id and unsupported kind.
- CLI tests for dry-run, write-to-output, and `-o` without `--write`.
- Docs test for CLI reference and output contract.

Full verification before completion:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

