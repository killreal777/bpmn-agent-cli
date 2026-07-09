# Review Command Design

## Goal

Add a read-only `review` command that produces a deterministic BPMN review packet for agents and humans.

## CLI Contract

```bash
bpmn-agent-cli review process.bpmn
```

The command returns the standard JSON envelope. Markdown rendering is deferred because `export --format markdown` already covers shareable context.

## Result Schema

```ts
type ReviewResult = {
  file: string;
  overview: OverviewResult;
  diagnostics: ValidateResult;
  participants: ParticipantsResult;
  lanes: LanesResult;
  events: EventsResult;
  subprocess: SubprocessResult;
  implementations: ImplementationsResult;
  riskFlags: Diagnostic[];
  checklist: Array<{
    id: string;
    text: string;
    relatedCodes: string[];
  }>;
};
```

## Rules

- `riskFlags` contains validation errors and warnings sorted by severity, element id, and code.
- `checklist` is deterministic and derived from the current model: diagnostics, gateways, implementations, boundary events, call activities, participants/lanes, and subprocesses.
- The command is read-only and does not call an LLM.

## Non-Goals

- No natural-language summarization.
- No markdown renderer in this iteration.
- No diff review packet yet; diff-specific review can build on `diff` later.
