# Variable-Aware Lint Design

## Goal

Extend `validate` with warnings based on extracted variable usage and CallActivity mappings.

## Scope

P4 variable-aware lint is warnings-only. It does not make a BPMN file invalid and does not change `validate` exit code unless existing structural errors are present.

Initial rules:

- `CALL_ACTIVITY_WITHOUT_MAPPINGS`: CallActivity has no explicit `camunda:in`, no explicit `camunda:out`, and no `variables="all"`.
- `CALL_ACTIVITY_IN_MISSING_TARGET`: `camunda:in` mapping has no `target`.
- `CALL_ACTIVITY_OUT_MISSING_TARGET`: `camunda:out` mapping has no `target`, unless it uses `variables="all"`.
- `CALL_ACTIVITY_SOURCE_EXPRESSION_WITHOUT_TARGET`: mapping has `sourceExpression` but no `target`.
- `CALL_ACTIVITY_VARIABLES_ALL_PASS_THROUGH`: mapping uses `variables="all"`.
- `CONDITION_VARIABLE_WITHOUT_PRODUCER`: sequence-flow condition reads a variable with no detected producer in CallActivity output mappings.

## Architecture

Add a focused helper in `src/validate/variableLint.ts`. `validateModel` calls it after existing structural diagnostics and appends warnings. The helper reuses `getVariables` and `getCallActivities`, so the lint rules stay aligned with the read commands.

## Result Contract

Diagnostics use the existing `Diagnostic` shape:

```ts
type Diagnostic = {
  severity: "warning";
  code: string;
  message: string;
  elementId?: string;
  details?: Record<string, unknown>;
};
```

## Non-Goals

- No expression-language execution.
- No custom XML parsing.
- No hard validation errors for variable lint in this iteration.

