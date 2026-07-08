# P1-B Path Command Design

## Goal

Add a read-only `path` command that finds deterministic control-flow paths between two BPMN elements:

```bash
bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1
```

The command helps agents answer focused reachability questions without inspecting raw BPMN XML.

## Non-Goals

- No cross-process pathfinding through message flows.
- No BPMN XML rewriting.
- No custom XML parser.
- No shortest-path weighting beyond deterministic breadth-first traversal.
- No markdown/text output.

## CLI Contract

```bash
bpmn-agent-cli path <file> --from <elementId> --to <elementId> [--direction forward|backward] [--depth <n>] [--max-paths <n>]
```

Defaults:

- `--direction forward`
- `--depth 10`
- `--max-paths 20`

Validation:

- missing file returns `MISSING_FILE_ARGUMENT`, exit `2`
- missing `--from` returns `INVALID_OPTION_VALUE`, exit `2`
- missing `--to` returns `INVALID_OPTION_VALUE`, exit `2`
- invalid `--direction` returns `INVALID_OPTION_VALUE`, exit `2`
- invalid `--depth` or `--max-paths` returns `INVALID_OPTION_VALUE`, exit `2`
- unknown `--from` or `--to` element returns `ELEMENT_NOT_FOUND`, exit `1`

## Result Schema

```ts
type PathResult = {
  from: ElementSummary;
  to: ElementSummary;
  direction: "forward" | "backward";
  depth: number;
  paths: PathSummary[];
  found: boolean;
  truncated: boolean;
};
```

`found` is `true` when at least one path reaches the target within limits.

`paths` contains only paths that reach the target. If no path is found, `paths` is an empty array.

For forward search, returned paths start with `from` and end with `to`. For backward search, returned paths also start with `from` and end with `to`; traversal walks incoming edges internally, but output remains in requested endpoint order.

`PathSummary.depth` is the number of sequence-flow edges in the path.

## Traversal Rules

Use sequence flows only.

Traversal must be cycle-safe:

- A path may include a repeated node once to show a cycle.
- Traversal must not continue after repeating a node already present in the current path.
- Repeated-node cycle paths are returned only if they reach the target.

Traversal order:

- breadth-first by depth
- sequence flows sorted by id ascending
- final paths sorted by `depth` ascending, then node id chain ascending, then flow id chain ascending

Truncation:

- `truncated` is `true` if additional branches or target-reaching paths were skipped because of `--depth` or `--max-paths`.
- `maxPaths` applies to returned target-reaching paths, not explored intermediate paths.

## Architecture

Follow existing layers:

- pure query in `src/query/path.ts`
- command wrapper in `src/cli/commands/pathCommand.ts`
- route in `src/cli/main.ts`
- shared `PathSummary` stays in `src/bpmn/types.ts`
- output envelope stays in `src/output`

Reuse existing indexes:

- `byId`
- `incomingByNodeId`
- `outgoingByNodeId`
- `sequenceFlowById`

Do not add indexes unless tests show the existing maps cannot support deterministic traversal.

## Testing

Use TDD:

- pure query tests for direct path, no path, cycle safety, backward direction, and truncation
- CLI tests for success envelope and required option errors
- docs tests for command documentation and `PathResult` contract
- final full verification and bundle smoke

Use existing fixtures:

- `simple-linear.bpmn` for direct forward path
- `cycle.bpmn` for cycle safety
- add a small fixture only if existing fixtures cannot demonstrate no-path behavior

## Documentation

Update:

- `docs/CLI.md`
- `docs/OUTPUT_CONTRACTS.md`
- `docs/ROADMAP.md`
- `README.md`
- `skills/bpmn-agent-cli/SKILL.md`

## Acceptance Criteria

- `bpmn-agent-cli path <file> --from <id> --to <id>` returns JSON envelope with `PathResult`.
- Forward and backward searches work.
- Cycles do not cause infinite traversal.
- Missing or invalid options produce JSON error envelopes.
- Existing `trace` and `context` behavior remains unchanged.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension` pass.
- Built CLI and temp-dir bundle smoke tests cover `path`.
