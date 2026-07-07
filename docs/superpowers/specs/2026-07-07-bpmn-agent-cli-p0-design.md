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

The command shape is command-first:

```bash
bpmn-agent-cli <command> [file] [options]
```

Examples:

```bash
bpmn-agent-cli overview process.bpmn
bpmn-agent-cli find process.bpmn --query "loan"
bpmn-agent-cli element process.bpmn --id Activity_CheckClient
bpmn-agent-cli trace process.bpmn --from Activity_CheckClient --direction forward
bpmn-agent-cli to-json process.bpmn --preset optimized
bpmn-agent-cli to-json --print-config optimized
```

The command-first shape is required because some commands do not need a BPMN input file, such as `to-json --print-config`, and future utility commands such as `version`, `doctor`, `schema`, or shell completion.

Read-only P0 commands support:

```bash
--pretty
--compact
--limit <n>
```

P0 supports JSON output only. `--pretty` formats the JSON for human reading. `--compact` keeps the output envelope in P0 to preserve one stable machine-readable contract. Markdown and text output are P1 unless a later implementation plan explicitly moves them into scope.

The legacy command is:

```bash
bpmn-agent-cli to-json [file] [-o <output>] [--preset base|optimized] [--print-config <preset>]
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

## Result Schemas

P0 command results must use these stable schemas. Optional fields may be omitted only when they are not applicable to the element or command.

```ts
export type ElementSummary = {
  id: string;
  type: string;
  name: string | null;
  processId?: string | null;
};

export type Diagnostic = {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  elementId?: string;
  details?: Record<string, unknown>;
};

export type SequenceFlowSummary = {
  id: string;
  type: 'bpmn:SequenceFlow';
  name: string | null;
  sourceId: string;
  sourceName: string | null;
  targetId: string;
  targetName: string | null;
  condition: string | null;
};

export type PathSummary = {
  nodes: ElementSummary[];
  flows: Array<{
    id: string;
    name: string | null;
    condition: string | null;
  }>;
  depth: number;
  cycleDetected?: boolean;
};
```

Command-specific result contracts:

```ts
export type OverviewResult = {
  definitions: { id: string | null };
  processes: Array<{
    id: string;
    name: string | null;
    flowNodes: number;
    sequenceFlows: number;
  }>;
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: number;
    messageFlows: number;
  }>;
  counts: {
    tasks: Record<string, number>;
    gateways: Record<string, number>;
    events: Record<string, number>;
    sequenceFlows: number;
    messageFlows: number;
  };
  extensions: string[];
  diagnosticsSummary: { errors: number; warnings: number; infos: number };
  warnings: Diagnostic[];
};

export type FindResult = {
  query: string | null;
  matches: Array<ElementSummary & {
    incoming: number;
    outgoing: number;
    score: number;
  }>;
  truncated: boolean;
};

export type ElementResult = {
  element: ElementSummary & {
    documentation?: string | null;
    incoming?: SequenceFlowSummary[];
    outgoing?: SequenceFlowSummary[];
    source?: ElementSummary | null;
    target?: ElementSummary | null;
    condition?: string | null;
    implementation?: ImplementationSummary | null;
    boundaryEvents?: EventSummary[];
    laneIds?: string[];
    participantId?: string | null;
  };
};

export type ContextResult = {
  focus: ElementSummary;
  before: PathSummary[];
  after: PathSummary[];
  boundaryEvents: Array<EventSummary & { targetPath?: string[] }>;
  truncated: boolean;
};

export type TraceResult = {
  from: ElementSummary;
  direction: 'forward' | 'backward';
  depth: number;
  paths: PathSummary[];
  truncated: boolean;
};

export type GatewayResult = {
  id: string;
  type: string;
  name: string | null;
  incoming: SequenceFlowSummary[];
  branches: Array<{
    flowId: string;
    name: string | null;
    condition: string | null;
    target: ElementSummary;
  }>;
  behavior: 'exclusive' | 'inclusive' | 'parallel' | 'eventBased';
  diagnostics: Diagnostic[];
};

export type ImplementationsResult = {
  serviceTasks: ImplementationSummary[];
  callActivities: ImplementationSummary[];
  listeners: ImplementationSummary[];
  forms: ImplementationSummary[];
};

export type ValidateResult = {
  valid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
  infos: Diagnostic[];
};
```

Shared implementation and event schemas:

```ts
export type ImplementationKind =
  | 'delegateExpression'
  | 'class'
  | 'expression'
  | 'externalTask'
  | 'callActivity'
  | 'listener'
  | 'form';

export type ImplementationSummary = {
  elementId: string;
  elementName: string | null;
  elementType: string;
  kind: ImplementationKind;
  value?: string;
  topic?: string;
  asyncBefore?: boolean;
  asyncAfter?: boolean;
  exclusive?: boolean;
  details?: Record<string, unknown>;
};

export type EventSummary = ElementSummary & {
  eventDefinitionType?: string | null;
};

export type MessageFlowSummary = {
  id: string;
  type: 'bpmn:MessageFlow';
  name: string | null;
  sourceId: string | null;
  sourceName: string | null;
  targetId: string | null;
  targetName: string | null;
};

export type ParticipantSummary = {
  id: string;
  name: string | null;
  processId: string | null;
};

export type LaneSummary = {
  id: string;
  name: string | null;
  flowNodeIds: string[];
};
```

## Index Model

`buildIndexes` creates deterministic maps with these shapes:

```ts
export interface BpmnIndexes {
  byId: Map<string, ElementSummary>;
  byNormalizedName: Map<string, ElementSummary[]>;
  byType: Map<string, ElementSummary[]>;
  byProcessId: Map<string, ElementSummary[]>;
  incomingByNodeId: Map<string, SequenceFlowSummary[]>;
  outgoingByNodeId: Map<string, SequenceFlowSummary[]>;
  sequenceFlowById: Map<string, SequenceFlowSummary>;
  messageFlowById: Map<string, MessageFlowSummary>;
  boundaryEventsByAttachedToId: Map<string, EventSummary[]>;
  childrenBySubprocessId: Map<string, ElementSummary[]>;
  participantByProcessId: Map<string, ParticipantSummary>;
  lanesByElementId: Map<string, LaneSummary[]>;
  implementationsByElementId: Map<string, ImplementationSummary[]>;
}
```

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

Returns bounded before/after paths around a focus element. Defaults are `--before 2`, `--after 2`, `--max-paths 20`, `--include-boundary-events true`, and `--include-extensions true`.

Cycle behavior:

- A path may include the repeated node once to show the cycle.
- Traversal must not continue after repeating a node already present in the current path.
- The result must include `truncated: true` if additional branches were skipped because of depth, path count, or cycle guards.

### `trace`

Returns forward or backward control-flow paths from a starting element. Defaults are `--direction forward`, `--depth 5`, and `--max-paths 20`. It preserves sequence-flow conditions and uses the same cycle behavior as `context`.

### `gateway`

Explains gateway incoming flows and outgoing branches. Exclusive and inclusive gateways include conditions. Parallel gateways explain parallel branch behavior and do not require conditions. If the target id is not a gateway, the command returns `ELEMENT_IS_NOT_GATEWAY`.

### `implementations`

Lists the P0 Camunda and BPMN runtime connection points:

- `camunda:class`
- `camunda:delegateExpression`
- `camunda:expression`
- `camunda:type="external"` with `camunda:topic`
- `camunda:formKey`
- `calledElement` for `bpmn:CallActivity`
- execution listeners with delegate, class, or expression values when they are directly available through moddle extension elements
- task listeners with delegate, class, or expression values when they are directly available through moddle extension elements

Call activity in/out mappings are P1 unless the legacy converter projection already exposes them without adding parsing complexity.

### `validate`

Runs syntax, reference, and semantic checks available in P0.

Validation pipeline:

1. Try `loadBpmn`.
2. If XML/BPMN parsing fails, return a `BPMN_PARSE_ERROR` envelope and exit `4`.
3. If parsing succeeds, build indexes.
4. Run reference and semantic diagnostics.
5. If diagnostics contain errors, return `ValidateResult` and exit `1`.
6. If diagnostics contain only warnings or infos, return `ValidateResult` and exit `0`.

P0 diagnostics:

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
- during BPMN analysis, no file reads except the explicitly provided BPMN input file, package-owned bundled metadata/descriptors, and files explicitly passed through CLI options
- no modifying input BPMN files in P0
- writing is allowed only to paths explicitly passed through output options, such as `to-json -o`
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
npm run build:extension
```

Run Claude plugin validation when `claude` is available:

```bash
claude plugin validate .
```

Smoke commands after build:

```bash
node dist/cli/main.js overview docs/bpmn-examples/loan-application-process.bpmn --pretty
node dist/cli/main.js find docs/bpmn-examples/loan-application-process.bpmn --query "loan" --pretty
node dist/cli/main.js validate docs/bpmn-examples/loan-application-process.bpmn --pretty
node dist/cli/main.js to-json docs/bpmn-examples/loan-application-process.bpmn --preset optimized > tmp/loan.optimized.json
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

P0 uses a bundled CLI strategy for GitHub-based Qwen/Claude installation. The repository must contain a committed self-contained runtime bundle:

```text
dist/extension/bpmn-agent-cli.cjs
```

`build:extension` must regenerate this bundle from source. The bundled CLI must run from an installed extension/plugin directory without running `npm install` inside the extension/plugin cache.

The Qwen extension manifest must include this shape:

```json
{
  "name": "bpmn-agent-cli",
  "version": "0.1.0",
  "contextFileName": "QWEN.md",
  "commands": "commands",
  "skills": "skills"
}
```

Qwen command files must invoke the bundled CLI through `${extensionPath}` and `${/}` path separators so the installed extension can run on Linux, macOS, and Windows.

Claude plugin metadata remains root-based in P0:

```text
.claude-plugin/
├── marketplace.json
└── plugin.json
```

The Claude plugin must not rely on files outside the copied plugin directory. The plugin must validate with:

```bash
claude plugin validate .
```

If root plugin source compatibility becomes a blocker during verification, the implementation must move to a nested plugin package before completion rather than documenting a broken install flow.

## P0 Execution Phases

The implementation plan must split P0 into three phases so the work remains reviewable:

- P0-A foundation: package setup, `loadBpmn`, `buildIndexes`, output envelope, error envelope, `overview`, basic `validate`, and tests.
- P0-B core read commands: `find`, `element`, `context`, `trace`, `gateway`, minimal `implementations`, CLI tests, and fixtures.
- P0-C distribution: legacy `to-json`, README, `AGENTS.md`, `docs/CLI.md`, `docs/OUTPUT_CONTRACTS.md`, `docs/ROADMAP.md`, Qwen extension files, Claude plugin manifests, skill, command file, bundled extension runtime, and install smoke checks.

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
- Extension installers require runtime artifacts when installing directly from GitHub. Mitigation: commit the self-contained `dist/extension/bpmn-agent-cli.cjs` bundle and verify it runs without local `node_modules`.

## Acceptance Criteria

The MVP is complete when:

- All P0 commands work.
- All read-only commands return JSON envelopes by default.
- CLI errors are machine-readable.
- Runtime remains local and deterministic.
- Core query functions are covered by tests.
- CLI smoke tests cover each P0 command.
- Legacy converter tests remain green.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run build:extension` pass.
- `dist/extension/bpmn-agent-cli.cjs` is committed and can run without local `node_modules`.
- `qwen-extension.json` exists and documents GitHub installation.
- After Qwen installation, the BPMN skill is visible and the command file can invoke the bundled CLI through `${extensionPath}`. If Qwen Code is unavailable locally, the skipped manual check is documented with the missing command.
- Claude plugin manifests exist and pass `claude plugin validate .` when Claude Code is available. If Claude Code is unavailable locally, the skipped manual check is documented with the missing command.
- Installed Claude plugin can invoke the bundled CLI without relying on files outside the plugin directory.
- `skills/bpmn-agent/SKILL.md` exists.
- README documents Qwen and Claude install flows.
