# BPMN Agent CLI P0 MVP Design

Date: 2026-07-07
Status: Approved for planning

## Goal

Build the full P0 MVP for `bpmn-agent-cli`: an agent-friendly, local, deterministic CLI for reading, analyzing, validating, and legacy-converting BPMN 2.0 files without requiring agents to read full BPMN XML.

## Scope

The P0 MVP includes these commands:

- `overview`
- `find`
- `element`
- `context`
- `trace`
- `gateway`
- `implementations`
- `validate`
- `to-json`

The MVP also includes project packaging, agent extension metadata, a BPMN agent skill, README updates, CLI documentation, output contracts, roadmap documentation, and compatibility with the existing `bpmn-to-json` converter behavior.

The MVP excludes MCP, web UI, RAG indexing, write commands, BPMNDI editing, custom BPMN parsing, network calls, LLM calls, Zeebe/Camunda 8 support, and P1/P2/P3 commands.

## Chosen Approach

Use the current empty `bpmn-agent-cli` repository as the new product repository and treat the sibling `bpmn-to-json` repository as the source for reusable assets, fixtures, dependency choices, and legacy converter behavior.

This is preferred over directly renaming or incrementally mutating the old repository because the current repository already has the desired product identity. The implementation should copy only what is needed from `bpmn-to-json`, keep the legacy converter as a module, and build the new CLI around clean product boundaries from the start.

## Architecture

The runtime pipeline is:

```text
file path -> loadBpmn -> buildIndexes -> query function -> output formatter -> CLI exit code
```

Project boundaries:

- `src/bpmn`: BPMN moddle setup, XML loading, low-level normalization, shared BPMN types, and BPMN-specific errors.
- `src/index`: deterministic index construction for elements, flows, processes, boundary events, participants, lanes, subprocess children, and implementation hooks.
- `src/query`: pure P0 use-case functions. These functions do not read files, write output, or access process globals.
- `src/validate`: diagnostics built from the loaded model and indexes.
- `src/output`: success envelopes, error envelopes, output formatting, and exit code mapping.
- `src/cli`: argument parsing, command routing, orchestration, and process exit behavior only.
- `src/legacy`: the `to-json` converter copied from the existing project with minimal changes.
- `src/testing`: reusable fixture helpers for Vitest.

CLI command modules may validate command-specific arguments, but they must not contain BPMN business logic. Business logic belongs in index, query, validate, or legacy modules.

## CLI Contract

The main binary is:

```bash
bpmn-agent-cli
```

The command shape is:

```bash
bpmn-agent-cli <file> <command> [options]
```

Read-only commands support:

```bash
--format json|text|markdown
--pretty
--compact
--limit <n>
```

JSON is the default output format. In P0, `--compact` keeps the output envelope to preserve one stable machine-readable contract.

The legacy command is:

```bash
bpmn-agent-cli <file> to-json [-o <output>] [--preset base|optimized] [--print-config <preset>]
```

If `to-json` receives `-o`, it writes the converted JSON to that path. If `-o` is omitted, it writes JSON to stdout. `--print-config` returns the selected converter preset without requiring an input file.

## Output Contract

Successful JSON output uses this envelope:

```json
{
  "ok": true,
  "command": "overview",
  "file": "process.bpmn",
  "result": {}
}
```

Error JSON output uses this envelope:

```json
{
  "ok": false,
  "error": {
    "code": "ELEMENT_NOT_FOUND",
    "message": "Element not found",
    "details": {
      "elementId": "Activity_X"
    },
    "suggestions": []
  }
}
```

Exit codes:

- `0`: success
- `1`: validation failed or domain error
- `2`: invalid CLI arguments
- `3`: file not found or cannot read
- `4`: BPMN/XML parse error
- `5`: internal error

In JSON mode, stdout must contain only parseable JSON. Debug and diagnostic logs must go to stderr.

## Index Model

`buildIndexes` creates deterministic maps for:

- `byId`
- `byNormalizedName`
- `byType`
- `byProcessId`
- `incomingByNodeId`
- `outgoingByNodeId`
- `sequenceFlowById`
- `messageFlowById`
- `boundaryEventsByAttachedToId`
- `childrenBySubprocessId`
- `participantByProcessId`
- `lanesByElementId`
- `implementationsByElementId`

Element summaries include `id`, `type`, `name`, and optional `processId`. Specialized summaries cover sequence flows, message flows, event definitions, lanes, participants, and Camunda implementation hooks.

Sorting must be stable and deterministic. Unless a command has a more specific order, summaries sort by `id`, then `type`, then `name`.

## Query Behavior

### `overview`

Returns definitions metadata, process summaries, collaboration summaries, counts, detected extension namespaces, diagnostics summary, and warnings. It excludes BPMNDI/layout data and sorts all arrays and object keys deterministically.

### `find`

Supports `--query`, `--id`, `--name`, `--type`, `--process`, and `--limit`.

Match priority:

1. exact id
2. exact normalized name
3. substring normalized name
4. substring id
5. type filter

Unknown type aliases return `INVALID_TYPE_FILTER`. No matches return an empty `matches` array, not an error.

### `element`

Returns structural details for tasks, gateways, events, subprocesses, call activities, and sequence flows. Missing elements return `ELEMENT_NOT_FOUND` with suggestions based on id and name matching.

### `context`

Returns bounded before/after paths around a focus element. Defaults are `--before 2`, `--after 2`, `--include-boundary-events true`, and `--include-extensions true`. Traversal must guard against cycles and report `truncated: true` when path count or depth limits cut off results.

### `trace`

Returns forward or backward control-flow paths from a starting element. It respects `--depth` and `--max-paths`, preserves sequence-flow conditions, and prevents infinite loops in cyclic diagrams.

### `gateway`

Explains gateway incoming flows and outgoing branches. Exclusive and inclusive gateways include conditions. Parallel gateways explain parallel branch behavior and do not require conditions. If the target id is not a gateway, the command returns `ELEMENT_IS_NOT_GATEWAY`.

### `implementations`

Lists Camunda and BPMN runtime connection points, including delegate expressions, Java classes, expressions, external task topics, form keys, call activities, execution listeners, task listeners, and call activity in/out mappings where available.

### `validate`

Runs syntax, reference, and semantic checks available in P0:

- moddle parse succeeds
- ids are unique in indexed scope
- sequence-flow source and target references exist
- boundary event `attachedToRef` exists
- flow node incoming/outgoing references point to existing sequence flows
- gateway shape is plausible
- exclusive and inclusive outgoing conditions are checked heuristically
- tasks without incoming or outgoing are warnings
- start events without incoming and end events without outgoing are valid

If errors exist, the command exits with code `1`. If only warnings exist, it exits with code `0`. Parse errors exit with code `4`.

## Runtime Constraints

The CLI must remain local, deterministic, and safe:

- no LLM calls
- no network calls during BPMN analysis
- no reading outside explicitly provided BPMN paths except bundled package metadata
- no modifying input BPMN files in P0
- no progress bars or colored output in JSON mode
- no stdout logs outside the selected output payload
- stable JSON ordering for the same input and arguments

## Testing Strategy

Implementation uses TDD. Each behavior starts with a failing Vitest test, the failure is verified, minimal implementation is added, and tests are rerun.

Required test layers:

- Unit tests for BPMN loading.
- Unit tests for index construction.
- Unit tests for each query function.
- CLI tests for all P0 commands.
- Error envelope and exit-code tests.
- Golden-style assertions for stable output shape and ordering.
- Legacy converter tests copied from `bpmn-to-json`.

Fixtures to reuse:

- `docs/bpmn-examples/loan-application-process.bpmn`
- `docs/bpmn-examples/risk-check-process.bpmn`
- `test/fixtures/simple-linear.bpmn`
- `test/fixtures/gateway-condition.bpmn`

Fixtures to add:

- `test/fixtures/boundary-timer.bpmn`
- `test/fixtures/camunda-implementations.bpmn`
- `test/fixtures/subprocess.bpmn`
- `test/fixtures/collaboration-message-flow.bpmn`
- `test/fixtures/broken-reference.bpmn`
- `test/fixtures/cycle.bpmn`

Completion verification commands:

```bash
npm test
npm run typecheck
npm run build
```

Smoke commands after build:

```bash
node dist/cli/main.js docs/bpmn-examples/loan-application-process.bpmn overview --pretty
node dist/cli/main.js docs/bpmn-examples/loan-application-process.bpmn find --query "loan" --pretty
node dist/cli/main.js docs/bpmn-examples/loan-application-process.bpmn validate --pretty
node dist/cli/main.js docs/bpmn-examples/loan-application-process.bpmn to-json --preset optimized > tmp/loan.optimized.json
```

## Packaging And Agent Metadata

P0 includes:

- `package.json` with `bin.bpmn-agent-cli`.
- TypeScript build output through `npm run build`.
- `qwen-extension.json`.
- `QWEN.md`.
- `.claude-plugin/plugin.json`.
- `.claude-plugin/marketplace.json`.
- `skills/bpmn-agent/SKILL.md`.
- `commands/bpmn.md` for command discoverability.

The extension/package should include a `build:extension` script that prepares compiled CLI artifacts. Generated `dist` should not be committed unless implementation testing shows the extension installers require committed compiled files.

## Documentation

P0 documentation includes:

- `README.md`: goal, development install, Qwen install, Claude install, CLI examples, current MVP status, runtime constraints, and relationship to `bpmn-to-json`.
- `AGENTS.md`: architecture rules, runtime rules, testing commands, no custom parser rule, no runtime network/LLM rule, and required verification commands.
- `docs/CLI.md`: complete P0 command reference with examples.
- `docs/OUTPUT_CONTRACTS.md`: success and error envelopes, result schemas, and error codes.
- `docs/ROADMAP.md`: P0/P1/P2/P3 scope.

## Risks And Mitigations

- P0 is broad. Mitigation: implement in small TDD tasks with frequent commits and keep query functions pure.
- BPMN moddle objects are cyclic and inconsistent across element kinds. Mitigation: normalize into summaries before query logic uses the model.
- Camunda extension coverage can expand quickly. Mitigation: support the required P0 attributes and return unknown extensions only when explicitly requested later.
- CLI argument parsing can become tangled. Mitigation: keep parser small and command-specific, with tests for invalid arguments and exit codes.
- Extension installers may require compiled artifacts. Mitigation: provide `build:extension` first; commit generated artifacts only if verification proves they are required.

## Acceptance Criteria

The MVP is complete when:

- All P0 commands work.
- All read-only commands return JSON envelopes by default.
- CLI errors are machine-readable.
- Runtime remains local and deterministic.
- Core query functions are covered by tests.
- CLI smoke tests cover each P0 command.
- Legacy converter tests remain green.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- Qwen extension manifest exists.
- Claude plugin manifests exist.
- `skills/bpmn-agent/SKILL.md` exists.
- README documents Qwen and Claude install flows.
