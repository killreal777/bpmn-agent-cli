# Context Agent Profile Design

## Goal

Add `context --profile agent` as a compact local-context profile that reduces JSON output tokens for agent reasoning while preserving enough structure to decide the next focused CLI call.

## CLI Contract

```bash
bpmn-agent-cli context process.bpmn --id Task_1
bpmn-agent-cli context process.bpmn --id Task_1 --profile agent
```

Default profile remains the existing full `ContextResult`. `--profile agent` returns a compact result with the same success envelope and command name.

Invalid profile values return `INVALID_OPTION_VALUE` with exit code `2`.

## Agent Result Schema

```ts
type AgentContextResult = {
  profile: "agent";
  focus: ElementSummary;
  incoming: Array<{
    flowId: string;
    sourceId: string;
    condition: string | null;
  }>;
  outgoing: Array<{
    flowId: string;
    targetId: string;
    condition: string | null;
  }>;
  before: CompactPathSummary[];
  after: CompactPathSummary[];
  boundaryEvents: Array<{
    id: string;
    name: string | null;
    type: string;
    eventDefinitionType?: string | null;
  }>;
  truncated: boolean;
};

type CompactPathSummary = {
  nodeIds: string[];
  flowIds: string[];
  conditions: Array<{ flowId: string; condition: string }>;
  depth: number;
  cycleDetected?: boolean;
};
```

The compact profile intentionally omits repeated node objects inside paths. It keeps a full summary only for focus; adjacent nodes are represented by ids so agents can call `element` only when they need more detail.

## Metrics Hypothesis

For local-context benchmark tasks, `--profile agent` should reduce estimated CLI output tokens without reducing deterministic task success.

## Non-Goals

- No natural-language summaries.
- No runtime LLM calls.
- No replacement of the existing full context profile.
