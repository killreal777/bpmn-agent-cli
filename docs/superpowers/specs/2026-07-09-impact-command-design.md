# Impact Command Design

## Goal

Add a read-only `impact` command that gives agents a compact change-impact card for one BPMN element.

## CLI Contract

```bash
bpmn-agent-cli impact process.bpmn --id Task_1
bpmn-agent-cli impact process.bpmn --id Task_1 --depth 5 --max-paths 20
```

The command returns the standard JSON envelope.

## Result Schema

```ts
type ImpactResult = {
  focus: ElementSummary;
  upstream: PathSummary[];
  downstream: PathSummary[];
  lanes: LaneSummary[];
  participant: ParticipantSummary | null;
  boundaryEvents: EventSummary[];
  implementations: ImplementationSummary[];
  callActivities: CallActivityContract[];
  affected: {
    upstreamElementIds: string[];
    downstreamElementIds: string[];
    implementationElementIds: string[];
    callActivityIds: string[];
  };
  truncated: boolean;
};
```

## Rules

- `upstream` paths end with the focus element.
- `downstream` paths start with the focus element.
- `affected.upstreamElementIds` and `affected.downstreamElementIds` are unique sorted ids excluding the focus id.
- `participant` is derived from the focus element process id when the process is represented by a collaboration participant.
- `callActivities` contains the focus call activity contract if the focus is a call activity, plus call activities encountered in upstream/downstream paths.

## Non-Goals

- No natural-language impact explanation.
- No repository-wide impact.
- No write planning or mutation.
- No BPMNDI/layout impact.
