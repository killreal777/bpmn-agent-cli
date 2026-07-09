# P4 Call Activity Read Command Design

## Goal

Add a focused read-only `call-activity` command that helps agents inspect BPMN CallActivity contracts without reading raw BPMN XML or using legacy `to-json`.

## User Need

Agents need to answer: which subprocess/key is invoked, which variables are mapped in, which variables are mapped out, whether `variables="all"` is used, and whether the CallActivity contract has obvious unsupported or ambiguous forms.

## CLI Contract

```bash
bpmn-agent-cli call-activity process.bpmn
bpmn-agent-cli call-activity process.bpmn --id Call_SubProcess
```

The command returns the standard JSON success/error envelope.

Without `--id`, it returns all `bpmn:CallActivity` elements sorted by id. With `--id`, it returns exactly one entry or an error.

If `--id` points to an existing non-CallActivity element, return `UNSUPPORTED_BPMN_ELEMENT_TYPE` with exit code `1`. If the element is missing, return `ELEMENT_NOT_FOUND`.

## Result Schema

```ts
type CallActivityResult = {
  callActivities: Array<{
    element: ElementSummary;
    calledElement: string | null;
    inputMappings: CallActivityMapping[];
    outputMappings: CallActivityMapping[];
    variables: string[];
    passThrough: boolean;
    businessKey: string | null;
    warnings: string[];
  }>;
  variables: VariableSummary[];
  warnings: string[];
};
```

`variables` summarizes only variable usages associated with the returned call activities. `passThrough` is true when any output mapping uses `variables="all"`. `businessKey` is the first detected business key mapping value, or `null`.

## Architecture

Reuse `getElementDetails` and the existing `CallActivityMapping` extraction. Keep a focused pure query in `src/query/callActivity.ts`; keep CLI parsing and envelope wiring in `src/cli/commands/callActivityCommand.ts`.

No custom BPMN parser, no network calls, no writes.

## Tests

- Query test for listing all CallActivities and extracting mappings.
- Query test for `--id`.
- Query test for non-CallActivity rejection.
- CLI test for JSON envelope.
- Docs/output-contract tests.

