# Diff Command Design

## Goal

Add read-only semantic BPMN diff so agents can compare two BPMN files without relying on raw XML diffs.

## CLI Contract

```bash
bpmn-agent-cli diff --base before.bpmn --candidate after.bpmn
```

The command returns the standard JSON envelope. Both paths are explicit options to avoid changing the global one-file command parser.

## Result Schema

```ts
type DiffResult = {
  baseFile: string;
  candidateFile: string;
  changes: {
    added: ElementSummary[];
    removed: ElementSummary[];
    renamed: Array<{ before: ElementSummary; after: ElementSummary }>;
    reconnected: Array<{
      id: string;
      before: SequenceFlowSummary;
      after: SequenceFlowSummary;
    }>;
    implementationChanged: Array<{
      element: ElementSummary;
      before: ImplementationSummary[];
      after: ImplementationSummary[];
    }>;
    documentationChanged: Array<{
      element: ElementSummary;
      before: string | null;
      after: string | null;
    }>;
  };
  counts: Record<keyof DiffResult["changes"], number>;
};
```

## Rules

- Compare indexed BPMN semantic elements by id.
- Ignore XML formatting and BPMNDI-only differences.
- Treat sequence-flow source/target/condition changes as `reconnected`.
- Treat name differences as `renamed`.
- Treat implementation summary differences as `implementationChanged`.
- Treat `bpmn:documentation` text differences as `documentationChanged`.

## Non-Goals

- No graphical layout diff.
- No XML text diff.
- No fuzzy matching for renamed ids in this iteration.

