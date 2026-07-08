# BPMN Agent CLI P0 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full P0 `bpmn-agent-cli` MVP with command-first JSON CLI queries, legacy raw `to-json`, validation, extension packaging, docs, and tests.

**Architecture:** The runtime pipeline is `file path -> loadBpmn -> buildIndexes -> query function -> output formatter -> CLI exit code`. Core BPMN behavior lives in `src/bpmn`, `src/index`, `src/query`, and `src/validate`; `src/cli` only parses arguments and routes commands; `src/legacy` preserves the existing converter.

**Tech Stack:** TypeScript ESM, Node.js 20+, `bpmn-moddle`, `camunda-bpmn-moddle`, Vitest, `tsx`, TypeScript compiler, and `esbuild` for the committed extension bundle.

---

## Source Inputs

- Design spec: `docs/superpowers/specs/2026-07-07-bpmn-agent-cli-p0-design.md`
- Requirements draft: `bpmn-agent-cli-requirements.md`
- Previous project symlink: `bpmn-to-json`
- Previous converter source: `bpmn-to-json/src/convert.ts`, `bpmn-to-json/src/config.ts`, `bpmn-to-json/src/optimizations/**`
- Previous tests and fixtures: `bpmn-to-json/test/**`, `bpmn-to-json/docs/bpmn-examples/**`

## File Structure

Create or modify these files:

```text
.gitignore
AGENTS.md
README.md
QWEN.md
commands/bpmn-agent-cli.md
docs/CLI.md
docs/OUTPUT_CONTRACTS.md
docs/ROADMAP.md
dist/extension/bpmn-agent-cli.cjs
package.json
package-lock.json
qwen-extension.json
scripts/build-extension.mjs
src/bpmn/errors.ts
src/bpmn/loadBpmn.ts
src/bpmn/moddle.ts
src/bpmn/normalize.ts
src/bpmn/types.ts
src/cli/args.ts
src/cli/commands/contextCommand.ts
src/cli/commands/elementCommand.ts
src/cli/commands/findCommand.ts
src/cli/commands/gatewayCommand.ts
src/cli/commands/implementationsCommand.ts
src/cli/commands/overviewCommand.ts
src/cli/commands/toJsonCommand.ts
src/cli/commands/traceCommand.ts
src/cli/commands/validateCommand.ts
src/cli/main.ts
src/index/buildIndexes.ts
src/index/typeAliases.ts
src/legacy/config.ts
src/legacy/convert.ts
src/legacy/optimizations/**
src/output/errors.ts
src/output/jsonOutput.ts
src/query/context.ts
src/query/element.ts
src/query/findElements.ts
src/query/gateway.ts
src/query/implementations.ts
src/query/overview.ts
src/query/trace.ts
src/testing/fixtures.ts
src/validate/validateModel.ts
skills/bpmn-agent-cli/SKILL.md
test/bpmn/loadBpmn.test.ts
test/cli/cli.test.ts
test/fixtures/boundary-timer.bpmn
test/fixtures/broken-reference.bpmn
test/fixtures/camunda-implementations.bpmn
test/fixtures/collaboration-message-flow.bpmn
test/fixtures/cycle.bpmn
test/fixtures/gateway-condition.bpmn
test/fixtures/simple-linear.bpmn
test/fixtures/subprocess.bpmn
test/index/buildIndexes.test.ts
test/legacy/convert.test.ts
test/output/jsonOutput.test.ts
test/query/context.test.ts
test/query/element.test.ts
test/query/findElements.test.ts
test/query/gateway.test.ts
test/query/implementations.test.ts
test/query/overview.test.ts
test/query/trace.test.ts
test/validate/validateModel.test.ts
tsconfig.json
vitest.config.ts
.claude-plugin/marketplace.json
.claude-plugin/plugin.json
```

`.gitignore` must ignore dependency and generated development output while allowing the committed extension bundle:

```gitignore
node_modules/
tmp/
coverage/
dist/*
!dist/extension/
!dist/extension/bpmn-agent-cli.cjs
```

## Execution Rules

- Before executing this plan, use `superpowers:using-git-worktrees` to decide whether to work in an isolated workspace.
- Use TDD for behavior code: write the failing test, run it and confirm the expected failure, implement the smallest working code, rerun the test, then refactor.
- Keep commits at the end of each task.
- Do not read full BPMN XML in user-facing agent workflows except via the CLI loader.
- Do not add custom BPMN/XML parsing. Duplicate id diagnostics are best-effort through moddle warnings or indexed elements.
- Do not make runtime network or LLM calls.

---

## P0-A Foundation

### Task 1: Project Bootstrap And Toolchain

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `test/package.test.ts`
- Create: `src/cli/main.ts`

- [ ] **Step 1: Write the failing package metadata test**

Create `test/package.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('package metadata', () => {
  it('exposes the bpmn-agent-cli binary and required scripts', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      name: string;
      type: string;
      bin: Record<string, string>;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(pkg.name).toBe('bpmn-agent-cli');
    expect(pkg.type).toBe('module');
    expect(pkg.bin['bpmn-agent-cli']).toBe('./dist/cli/main.js');
    expect(pkg.scripts).toMatchObject({
      build: 'tsc',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
      'build:extension': 'npm run build && node scripts/build-extension.mjs'
    });
    expect(pkg.dependencies).toHaveProperty('bpmn-moddle');
    expect(pkg.dependencies).toHaveProperty('camunda-bpmn-moddle');
    expect(pkg.devDependencies).toHaveProperty('esbuild');
    expect(pkg.devDependencies).toHaveProperty('vitest');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/package.test.ts
```

Expected: FAIL because `package.json` or required fields do not exist.

- [ ] **Step 3: Create project metadata and minimal CLI entrypoint**

Create `.gitignore`:

```gitignore
node_modules/
tmp/
coverage/
dist/*
!dist/extension/
!dist/extension/bpmn-agent-cli.cjs
```

Create `package.json`:

```json
{
  "name": "bpmn-agent-cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "bpmn-agent-cli": "./dist/cli/main.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build:extension": "npm run build && node scripts/build-extension.mjs",
    "start": "tsx src/cli/main.ts"
  },
  "dependencies": {
    "bpmn-moddle": "^9.0.4",
    "camunda-bpmn-moddle": "^7.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.15.29",
    "esbuild": "^0.25.0",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^3.1.4"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    pool: 'forks'
  }
});
```

Create `src/cli/main.ts`:

```ts
#!/usr/bin/env node

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help') || args.length === 0) {
    process.stdout.write('Usage: bpmn-agent-cli <command> [file] [options]\n');
    return;
  }

  process.stdout.write(JSON.stringify({
    ok: false,
    error: {
      code: 'INVALID_COMMAND',
      message: `Unknown command: ${args[0]}`
    }
  }));
  process.exitCode = 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 5;
  });
}
```

- [ ] **Step 4: Install dependencies and verify bootstrap passes**

Run:

```bash
npm install
npm test -- test/package.test.ts
npm run typecheck
```

Expected: PASS for package metadata test and typecheck exit code `0`.

- [ ] **Step 5: Commit bootstrap**

```bash
git add .gitignore package.json package-lock.json tsconfig.json vitest.config.ts src/cli/main.ts test/package.test.ts
git commit -m "chore: bootstrap bpmn agent cli project"
```

### Task 2: Port Legacy Converter And Fixtures

**Files:**
- Create: `src/legacy/config.ts`
- Create: `src/legacy/convert.ts`
- Create: `src/legacy/optimizations/**`
- Create: `test/legacy/convert.test.ts`
- Create: `test/fixtures/simple-linear.bpmn`
- Create: `test/fixtures/gateway-condition.bpmn`
- Create: `docs/bpmn-examples/loan-application-process.bpmn`
- Create: `docs/bpmn-examples/risk-check-process.bpmn`

- [ ] **Step 1: Write the failing legacy converter test**

Copy `bpmn-to-json/test/convert.test.ts` to `test/legacy/convert.test.ts` and update imports:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { getPresetConfig } from '../../src/legacy/config.js';
import { convertBpmnToJson } from '../../src/legacy/convert.js';
```

Keep the existing assertions from the previous project so converter compatibility is protected.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/legacy/convert.test.ts
```

Expected: FAIL with module-not-found for `../../src/legacy/convert.js` or missing fixtures.

- [ ] **Step 3: Copy converter source and fixtures**

Run:

```bash
mkdir -p src/legacy/optimizations test/fixtures docs/bpmn-examples
cp bpmn-to-json/src/config.ts src/legacy/config.ts
cp bpmn-to-json/src/convert.ts src/legacy/convert.ts
cp bpmn-to-json/src/optimizations/*.ts src/legacy/optimizations/
cp bpmn-to-json/test/fixtures/simple-linear.bpmn test/fixtures/simple-linear.bpmn
cp bpmn-to-json/test/fixtures/gateway-condition.bpmn test/fixtures/gateway-condition.bpmn
cp bpmn-to-json/docs/bpmn-examples/loan-application-process.bpmn docs/bpmn-examples/loan-application-process.bpmn
cp bpmn-to-json/docs/bpmn-examples/risk-check-process.bpmn docs/bpmn-examples/risk-check-process.bpmn
```

Update imports in copied legacy files from `./optimizations/...` only if TypeScript reports path errors. The target layout preserves the old relative import shape.

- [ ] **Step 4: Run legacy tests and typecheck**

Run:

```bash
npm test -- test/legacy/convert.test.ts
npm run typecheck
```

Expected: PASS for converter tests and typecheck exit code `0`.

- [ ] **Step 5: Commit legacy port**

```bash
git add src/legacy test/legacy test/fixtures/simple-linear.bpmn test/fixtures/gateway-condition.bpmn docs/bpmn-examples
git commit -m "feat: preserve legacy bpmn to json converter"
```

### Task 3: BPMN Loader And Shared Types

**Files:**
- Create: `src/bpmn/moddle.ts`
- Create: `src/bpmn/errors.ts`
- Create: `src/bpmn/types.ts`
- Create: `src/bpmn/loadBpmn.ts`
- Create: `src/testing/fixtures.ts`
- Create: `test/bpmn/loadBpmn.test.ts`

- [ ] **Step 1: Write failing loader tests**

Create `test/bpmn/loadBpmn.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('loadBpmn', () => {
  it('loads BPMN definitions with Camunda extension support', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(model.filePath.endsWith('simple-linear.bpmn')).toBe(true);
    expect(model.definitions.id).toBe('Definitions_SimpleLinear');
    expect(model.processes.map((process) => process.id)).toEqual(['Process_SimpleLinear']);
    expect(model.warnings).toEqual([]);
  });

  it('maps unreadable files to FILE_NOT_FOUND domain errors', async () => {
    await expect(loadBpmn('test/fixtures/missing.bpmn')).rejects.toMatchObject({
      code: 'FILE_NOT_FOUND',
      exitCode: 3
    });
  });

  it('maps invalid XML to BPMN_PARSE_ERROR domain errors', async () => {
    await expect(loadBpmn(fixturePath('invalid-xml.bpmn'))).rejects.toMatchObject({
      code: 'BPMN_PARSE_ERROR',
      exitCode: 4
    });
  });
});
```

Create `test/fixtures/invalid-xml.bpmn`:

```xml
<definitions><process></definitions>
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/bpmn/loadBpmn.test.ts
```

Expected: FAIL with module-not-found for `loadBpmn`.

- [ ] **Step 3: Implement loader and shared errors**

Create `src/bpmn/errors.ts`:

```ts
export type BpmnErrorCode =
  | 'INVALID_ARGUMENTS'
  | 'MISSING_FILE_ARGUMENT'
  | 'INVALID_COMMAND'
  | 'INVALID_OPTION_VALUE'
  | 'FILE_NOT_FOUND'
  | 'FILE_READ_ERROR'
  | 'BPMN_PARSE_ERROR'
  | 'ELEMENT_NOT_FOUND'
  | 'ELEMENT_IS_NOT_GATEWAY'
  | 'INVALID_TYPE_FILTER'
  | 'UNSUPPORTED_BPMN_ELEMENT_TYPE'
  | 'REFERENCE_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'OUTPUT_WRITE_ERROR'
  | 'INTERNAL_ERROR';

export class BpmnCliError extends Error {
  constructor(
    public readonly code: BpmnErrorCode,
    message: string,
    public readonly exitCode: number,
    public readonly details: Record<string, unknown> = {},
    public readonly suggestions: unknown[] = []
  ) {
    super(message);
  }
}
```

Create `src/bpmn/moddle.ts`:

```ts
import { createRequire } from 'node:module';
import BpmnModdle from 'bpmn-moddle';

const require = createRequire(import.meta.url);
const camundaModdle = require('camunda-bpmn-moddle/resources/camunda.json') as Record<string, unknown>;

export function createBpmnModdle(): BpmnModdle {
  return new BpmnModdle({ camunda: camundaModdle });
}
```

Create `src/bpmn/types.ts` with the result and index types from the design spec.

Create `src/testing/fixtures.ts`:

```ts
import { join } from 'node:path';

export function fixturePath(name: string): string {
  return join('test', 'fixtures', name);
}
```

Create `src/bpmn/loadBpmn.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { createBpmnModdle } from './moddle.js';
import { BpmnCliError } from './errors.js';
import type { LoadedBpmnModel, ModdleElement } from './types.js';

export async function loadBpmn(filePath: string): Promise<LoadedBpmnModel> {
  let xml: string;
  try {
    xml = await readFile(filePath, 'utf8');
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    throw new BpmnCliError(
      nodeError.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'FILE_READ_ERROR',
      nodeError.code === 'ENOENT' ? 'File not found' : 'Cannot read file',
      3,
      { filePath }
    );
  }

  try {
    const moddle = createBpmnModdle();
    const { rootElement, warnings } = await moddle.fromXML(xml);
    const definitions = rootElement as ModdleElement;
    const rootElements = arrayOf<ModdleElement>(definitions.rootElements);

    return {
      filePath,
      xml,
      definitions,
      rootElements,
      processes: rootElements.filter((element) => element.$type === 'bpmn:Process'),
      collaborations: rootElements.filter((element) => element.$type === 'bpmn:Collaboration'),
      warnings: warnings.map((warning: { message?: string }) => ({ message: warning.message ?? 'BPMN parser warning' }))
    };
  } catch (error: unknown) {
    throw new BpmnCliError('BPMN_PARSE_ERROR', 'BPMN/XML parse error', 4, {
      filePath,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
```

- [ ] **Step 4: Run loader tests and typecheck**

Run:

```bash
npm test -- test/bpmn/loadBpmn.test.ts
npm run typecheck
```

Expected: PASS for loader tests and typecheck exit code `0`.

- [ ] **Step 5: Commit loader**

```bash
git add src/bpmn src/testing test/bpmn test/fixtures/invalid-xml.bpmn
git commit -m "feat: load bpmn models with camunda support"
```

### Task 4: Index Builder

**Files:**
- Create: `src/bpmn/normalize.ts`
- Create: `src/index/typeAliases.ts`
- Create: `src/index/buildIndexes.ts`
- Create: `test/index/buildIndexes.test.ts`
- Create: `test/fixtures/boundary-timer.bpmn`
- Create: `test/fixtures/camunda-implementations.bpmn`
- Create: `test/fixtures/collaboration-message-flow.bpmn`
- Create: `test/fixtures/subprocess.bpmn`

- [ ] **Step 1: Write failing index tests**

Create `test/index/buildIndexes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('buildIndexes', () => {
  it('indexes elements, names, types, and sequence flows', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const indexes = buildIndexes(model);

    expect(indexes.byId.get('Task_1')).toMatchObject({
      id: 'Task_1',
      type: 'bpmn:Task',
      name: 'Do work',
      processId: 'Process_SimpleLinear'
    });
    expect(indexes.byNormalizedName.get('do work')?.map((item) => item.id)).toEqual(['Task_1']);
    expect(indexes.byType.get('bpmn:Task')?.map((item) => item.id)).toEqual(['Task_1']);
    expect(indexes.outgoingByNodeId.get('StartEvent_1')?.[0]).toMatchObject({
      id: 'Flow_Start_To_Task',
      sourceId: 'StartEvent_1',
      targetId: 'Task_1'
    });
    expect(indexes.incomingByNodeId.get('Task_1')?.[0].id).toBe('Flow_Start_To_Task');
  });

  it('indexes boundary events and implementation hooks', async () => {
    const boundary = buildIndexes(await loadBpmn(fixturePath('boundary-timer.bpmn')));
    const camunda = buildIndexes(await loadBpmn(fixturePath('camunda-implementations.bpmn')));

    expect(boundary.boundaryEventsByAttachedToId.get('Activity_Work')?.[0]).toMatchObject({
      id: 'Boundary_Timer',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    });
    expect(camunda.implementationsByElementId.get('Service_Delegate')).toContainEqual(expect.objectContaining({
      kind: 'delegateExpression',
      value: '${checkClientDelegate}'
    }));
    expect(camunda.implementationsByElementId.get('Service_External')).toContainEqual(expect.objectContaining({
      kind: 'externalTask',
      topic: 'score-client'
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/index/buildIndexes.test.ts
```

Expected: FAIL with module-not-found for `buildIndexes` or missing new fixtures.

- [ ] **Step 3: Add BPMN fixtures**

Create the four BPMN fixtures listed in the task. Keep each XML fixture minimal: one definitions root, one process or collaboration, ids matching the test names, and no BPMNDI layout requirement. Use the existing fixture style from `test/fixtures/simple-linear.bpmn`.

- [ ] **Step 4: Implement normalization and indexes**

Create `src/bpmn/normalize.ts`:

```ts
export function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function arrayOf<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
```

Create `src/index/typeAliases.ts` with aliases from the requirements:

```ts
export const TYPE_ALIASES = new Map<string, string[]>([
  ['task', ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ScriptTask', 'bpmn:BusinessRuleTask', 'bpmn:SendTask', 'bpmn:ReceiveTask', 'bpmn:ManualTask']],
  ['userTask', ['bpmn:UserTask']],
  ['serviceTask', ['bpmn:ServiceTask']],
  ['gateway', ['bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:EventBasedGateway']],
  ['exclusiveGateway', ['bpmn:ExclusiveGateway']],
  ['event', ['bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:BoundaryEvent']],
  ['startEvent', ['bpmn:StartEvent']],
  ['endEvent', ['bpmn:EndEvent']],
  ['boundaryEvent', ['bpmn:BoundaryEvent']],
  ['sequenceFlow', ['bpmn:SequenceFlow']],
  ['subprocess', ['bpmn:SubProcess']],
  ['callActivity', ['bpmn:CallActivity']]
]);
```

Create `src/index/buildIndexes.ts` with these exported functions:

```ts
import { arrayOf, normalizeName, stringValue } from '../bpmn/normalize.js';
import type { BpmnIndexes, ElementSummary, LoadedBpmnModel, ModdleElement, SequenceFlowSummary } from '../bpmn/types.js';

export function buildIndexes(model: LoadedBpmnModel): BpmnIndexes {
  // Build byId, byName, byType, byProcessId, sequence flows, message flows,
  // boundary events, lane mappings, participant mappings, subprocess children,
  // and implementation hooks in deterministic sorted order.
}

export function summarizeElement(element: ModdleElement, processId: string | null = null): ElementSummary {
  return {
    id: String(element.id),
    type: String(element.$type),
    name: stringValue(element.name),
    processId
  };
}
```

Implement `buildIndexes` by walking each process `flowElements`, subprocess `flowElements`, collaboration `participants`, `messageFlows`, and lane sets. Sort arrays with `id`, `type`, `name`. Extract Camunda attributes directly from moddle properties: `delegateExpression`, `class`, `expression`, `type`, `topic`, `formKey`, `asyncBefore`, `asyncAfter`, `exclusive`, and extension values for execution/task listeners.

- [ ] **Step 5: Run index tests and typecheck**

Run:

```bash
npm test -- test/index/buildIndexes.test.ts
npm run typecheck
```

Expected: PASS for index tests and typecheck exit code `0`.

- [ ] **Step 6: Commit index builder**

```bash
git add src/bpmn/normalize.ts src/index test/index test/fixtures/boundary-timer.bpmn test/fixtures/camunda-implementations.bpmn test/fixtures/collaboration-message-flow.bpmn test/fixtures/subprocess.bpmn
git commit -m "feat: build deterministic bpmn indexes"
```

### Task 5: Output Envelopes And CLI Error Contracts

**Files:**
- Create: `src/output/errors.ts`
- Create: `src/output/jsonOutput.ts`
- Create: `test/output/jsonOutput.test.ts`

- [ ] **Step 1: Write failing output tests**

Create `test/output/jsonOutput.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { errorEnvelope, successEnvelope, toExitCode } from '../../src/output/jsonOutput.js';

describe('json output envelopes', () => {
  it('wraps query success results', () => {
    expect(successEnvelope({
      command: 'overview',
      file: 'process.bpmn',
      result: { counts: { sequenceFlows: 2 } }
    })).toEqual({
      ok: true,
      command: 'overview',
      file: 'process.bpmn',
      result: { counts: { sequenceFlows: 2 } }
    });
  });

  it('wraps domain errors with suggestions and exit codes', () => {
    const error = new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: 'Task_X' }, [
      { id: 'Task_1', type: 'bpmn:Task', name: 'Do work', score: 0.7 }
    ]);

    expect(errorEnvelope(error)).toEqual({
      ok: false,
      error: {
        code: 'ELEMENT_NOT_FOUND',
        message: 'Element not found',
        details: { elementId: 'Task_X' },
        suggestions: [{ id: 'Task_1', type: 'bpmn:Task', name: 'Do work', score: 0.7 }]
      }
    });
    expect(toExitCode(error)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/output/jsonOutput.test.ts
```

Expected: FAIL with module-not-found for `jsonOutput`.

- [ ] **Step 3: Implement output helpers**

Create `src/output/jsonOutput.ts` with:

```ts
import { BpmnCliError } from '../bpmn/errors.js';

export function successEnvelope(args: { command: string; file: string | null; result: unknown }): unknown {
  return {
    ok: true,
    command: args.command,
    file: args.file,
    result: args.result
  };
}

export function errorEnvelope(error: unknown): unknown {
  if (error instanceof BpmnCliError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        suggestions: error.suggestions
      }
    };
  }

  return {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : String(error),
      details: {},
      suggestions: []
    }
  };
}

export function toExitCode(error: unknown): number {
  return error instanceof BpmnCliError ? error.exitCode : 5;
}

export function writeJson(value: unknown, pretty = false): void {
  process.stdout.write(`${JSON.stringify(value, null, pretty ? 2 : 0)}\n`);
}
```

Create `src/output/errors.ts` to re-export `BpmnCliError` for CLI modules:

```ts
export { BpmnCliError } from '../bpmn/errors.js';
export type { BpmnErrorCode } from '../bpmn/errors.js';
```

- [ ] **Step 4: Run output tests**

Run:

```bash
npm test -- test/output/jsonOutput.test.ts
npm run typecheck
```

Expected: PASS for output tests and typecheck exit code `0`.

- [ ] **Step 5: Commit output contracts**

```bash
git add src/output test/output
git commit -m "feat: add json output envelopes"
```

### Task 6: Overview, Basic Validate, And CLI Routing

**Files:**
- Create: `src/query/overview.ts`
- Create: `src/validate/validateModel.ts`
- Create: `src/cli/args.ts`
- Create: `src/cli/commands/overviewCommand.ts`
- Create: `src/cli/commands/validateCommand.ts`
- Modify: `src/cli/main.ts`
- Create: `test/query/overview.test.ts`
- Create: `test/validate/validateModel.test.ts`
- Create: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing overview and validate tests**

Create `test/query/overview.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getOverview } from '../../src/query/overview.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getOverview', () => {
  it('summarizes processes, counts, extensions, and warnings', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getOverview(model, buildIndexes(model));

    expect(result.definitions).toEqual({ id: 'Definitions_SimpleLinear' });
    expect(result.processes).toEqual([{ id: 'Process_SimpleLinear', name: 'Simple linear', flowNodes: 3, sequenceFlows: 2 }]);
    expect(result.counts.sequenceFlows).toBe(2);
    expect(result.counts.tasks).toEqual({ 'bpmn:Task': 1 });
    expect(result.diagnosticsSummary).toEqual({ errors: 0, warnings: 0, infos: 0 });
  });
});
```

Create `test/validate/validateModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { validateModel } from '../../src/validate/validateModel.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('validateModel', () => {
  it('returns valid for a simple linear model', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = validateModel(model, buildIndexes(model));

    expect(result).toMatchObject({ valid: true, errors: [], infos: [] });
  });
});
```

- [ ] **Step 2: Write failing CLI smoke tests**

Add to `test/cli/cli.test.ts`:

```ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('CLI overview and validate', () => {
  it('prints overview envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'overview', 'test/fixtures/simple-linear.bpmn']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'overview',
      file: 'test/fixtures/simple-linear.bpmn',
      result: { definitions: { id: 'Definitions_SimpleLinear' } }
    });
  });

  it('prints validate envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'validate', 'test/fixtures/simple-linear.bpmn']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'validate',
      result: { valid: true, errors: [] }
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- test/query/overview.test.ts test/validate/validateModel.test.ts test/cli/cli.test.ts
```

Expected: FAIL with module-not-found for query and CLI command modules.

- [ ] **Step 4: Implement overview, validate, args, and CLI routing**

Create `src/cli/args.ts`:

```ts
export type ParsedArgs = {
  command: string;
  file: string | null;
  options: Map<string, string | boolean>;
};

export function parseArgs(args: string[]): ParsedArgs {
  const [command, candidateFile, ...rest] = args;
  const options = new Map<string, string | boolean>();
  const file = candidateFile && !candidateFile.startsWith('-') ? candidateFile : null;
  const optionArgs = file ? rest : [candidateFile, ...rest].filter((value): value is string => Boolean(value));

  for (let index = 0; index < optionArgs.length; index += 1) {
    const item = optionArgs[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const next = optionArgs[index + 1];
    if (next && !next.startsWith('--')) {
      options.set(item, next);
      index += 1;
    } else {
      options.set(item, true);
    }
  }

  return { command: command ?? '', file, options };
}
```

Implement `getOverview`, `validateModel`, command wrappers, and replace `src/cli/main.ts` with a router for `overview` and `validate`. The router must call `loadBpmn`, `buildIndexes`, query function, then `successEnvelope`, and use `errorEnvelope` on errors.

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- test/query/overview.test.ts test/validate/validateModel.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for overview, validate, CLI smoke tests, and typecheck exit code `0`.

- [ ] **Step 6: Commit P0-A foundation**

```bash
git add src/query/overview.ts src/validate/validateModel.ts src/cli test/query/overview.test.ts test/validate/validateModel.test.ts test/cli/cli.test.ts
git commit -m "feat: add overview and validate cli foundation"
```

---

## P0-B Core Read Commands

### Task 7: Find Query And Command

**Files:**
- Create: `src/query/findElements.ts`
- Create: `src/cli/commands/findCommand.ts`
- Modify: `src/cli/main.ts`
- Create: `test/query/findElements.test.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing find query tests**

Create `test/query/findElements.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { findElements } from '../../src/query/findElements.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('findElements', () => {
  it('prioritizes exact id and deterministic scores', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findElements(buildIndexes(model), { query: 'Task_1', limit: 10 });

    expect(result.matches[0]).toMatchObject({ id: 'Task_1', score: 1 });
    expect(result.truncated).toBe(false);
  });

  it('finds by normalized name substring', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findElements(buildIndexes(model), { query: 'work', limit: 10 });

    expect(result.matches).toContainEqual(expect.objectContaining({ id: 'Task_1', score: 0.8 }));
  });

  it('rejects unknown type filters', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => findElements(buildIndexes(model), { type: 'nonsense', limit: 10 })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- test/query/findElements.test.ts
```

Expected: FAIL with module-not-found for `findElements`.

- [ ] **Step 3: Implement find query**

Create `src/query/findElements.ts` exporting:

```ts
export type FindElementsArgs = {
  query?: string;
  id?: string;
  name?: string;
  type?: string;
  processId?: string;
  limit: number;
};

export function findElements(indexes: BpmnIndexes, args: FindElementsArgs): FindResult {
  // Score exact id 1.0, exact normalized name 0.95, substring normalized name 0.8,
  // substring id 0.7, type-only 0.5. Sort score desc, id asc, type asc, name asc.
}
```

Use `TYPE_ALIASES` for aliases and canonical `bpmn:*` types directly. Throw `BpmnCliError('INVALID_TYPE_FILTER', 'Invalid type filter', 2, { type })` for unknown aliases.

- [ ] **Step 4: Add CLI command and smoke assertion**

Add a `find` command wrapper that reads `--query`, `--id`, `--name`, `--type`, `--process`, and `--limit`. Add CLI smoke test:

```ts
it('prints find envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'find', 'test/fixtures/simple-linear.bpmn', '--query', 'work']);
  const parsed = JSON.parse(stdout);

  expect(parsed).toMatchObject({
    ok: true,
    command: 'find',
    result: { matches: [expect.objectContaining({ id: 'Task_1', score: 0.8 })] }
  });
});
```

- [ ] **Step 5: Run find tests and typecheck**

Run:

```bash
npm test -- test/query/findElements.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for find tests and typecheck exit code `0`.

- [ ] **Step 6: Commit find**

```bash
git add src/query/findElements.ts src/cli/commands/findCommand.ts src/cli/main.ts test/query/findElements.test.ts test/cli/cli.test.ts
git commit -m "feat: add deterministic bpmn find command"
```

### Task 8: Element And Gateway Queries

**Files:**
- Create: `src/query/element.ts`
- Create: `src/query/gateway.ts`
- Create: `src/cli/commands/elementCommand.ts`
- Create: `src/cli/commands/gatewayCommand.ts`
- Modify: `src/cli/main.ts`
- Create: `test/query/element.test.ts`
- Create: `test/query/gateway.test.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing element and gateway tests**

Create `test/query/element.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getElement } from '../../src/query/element.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getElement', () => {
  it('returns task structure with incoming and outgoing flows', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getElement(buildIndexes(model), { id: 'Task_1' });

    expect(result.element).toMatchObject({
      id: 'Task_1',
      type: 'bpmn:Task',
      incoming: [expect.objectContaining({ id: 'Flow_Start_To_Task' })],
      outgoing: [expect.objectContaining({ id: 'Flow_Task_To_End' })]
    });
  });

  it('throws ELEMENT_NOT_FOUND with suggestions', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => getElement(buildIndexes(model), { id: 'Task_X' })).toThrow(BpmnCliError);
  });
});
```

Create `test/query/gateway.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { explainGateway } from '../../src/query/gateway.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('explainGateway', () => {
  it('returns outgoing branches with conditions', async () => {
    const model = await loadBpmn(fixturePath('gateway-condition.bpmn'));
    const result = explainGateway(buildIndexes(model), { id: 'Gateway_1' });

    expect(result).toMatchObject({
      id: 'Gateway_1',
      behavior: 'exclusive',
      branches: [
        expect.objectContaining({ flowId: 'Flow_Gateway_To_Approve', condition: 'riskScore < 50' }),
        expect.objectContaining({ flowId: 'Flow_Gateway_To_Reject', condition: 'riskScore >= 50' })
      ]
    });
  });

  it('rejects non-gateway ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => explainGateway(buildIndexes(model), { id: 'Task_1' })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- test/query/element.test.ts test/query/gateway.test.ts
```

Expected: FAIL with module-not-found for `element` and `gateway`.

- [ ] **Step 3: Implement element and gateway queries**

Create `getElement(indexes, { id })` to return `ElementResult` with canonical type, incoming/outgoing flows, sequence-flow source/target/condition, boundary events, lane ids, participant id, and `implementations`.

Create `explainGateway(indexes, { id })` to return `GatewayResult`; throw `ELEMENT_IS_NOT_GATEWAY` for non-gateway ids.

- [ ] **Step 4: Add CLI command smoke tests**

Add CLI smoke tests for `element` and `gateway`:

```ts
it('prints element envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'element', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1']);
  expect(JSON.parse(stdout)).toMatchObject({ ok: true, command: 'element', result: { element: { id: 'Task_1' } } });
});

it('prints gateway envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'gateway', 'test/fixtures/gateway-condition.bpmn', '--id', 'Gateway_1']);
  expect(JSON.parse(stdout)).toMatchObject({ ok: true, command: 'gateway', result: { id: 'Gateway_1', behavior: 'exclusive' } });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- test/query/element.test.ts test/query/gateway.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for element, gateway, CLI tests, and typecheck exit code `0`.

- [ ] **Step 6: Commit element and gateway**

```bash
git add src/query/element.ts src/query/gateway.ts src/cli/commands/elementCommand.ts src/cli/commands/gatewayCommand.ts src/cli/main.ts test/query/element.test.ts test/query/gateway.test.ts test/cli/cli.test.ts
git commit -m "feat: add element and gateway commands"
```

### Task 9: Context And Trace Traversal

**Files:**
- Create: `src/query/trace.ts`
- Create: `src/query/context.ts`
- Create: `src/cli/commands/traceCommand.ts`
- Create: `src/cli/commands/contextCommand.ts`
- Modify: `src/cli/main.ts`
- Create: `test/fixtures/cycle.bpmn`
- Create: `test/query/trace.test.ts`
- Create: `test/query/context.test.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing traversal tests**

Create `test/query/trace.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { trace } from '../../src/query/trace.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('trace', () => {
  it('traces forward paths with edge depth', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = trace(buildIndexes(model), { from: 'StartEvent_1', direction: 'forward', depth: 5, maxPaths: 20 });

    expect(result.paths[0]).toMatchObject({
      nodes: [
        expect.objectContaining({ id: 'StartEvent_1' }),
        expect.objectContaining({ id: 'Task_1' }),
        expect.objectContaining({ id: 'EndEvent_1' })
      ],
      depth: 2
    });
    expect(result.paths[0].flows).toHaveLength(2);
  });

  it('stops traversal after showing a repeated cycle node once', async () => {
    const model = await loadBpmn(fixturePath('cycle.bpmn'));
    const result = trace(buildIndexes(model), { from: 'Task_A', direction: 'forward', depth: 10, maxPaths: 20 });

    expect(result.paths.some((path) => path.cycleDetected)).toBe(true);
  });
});
```

Create `test/query/context.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getContext } from '../../src/query/context.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getContext', () => {
  it('returns before paths ending with focus and after paths starting with focus', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getContext(buildIndexes(model), { id: 'Task_1', before: 2, after: 2, maxPaths: 20 });

    expect(result.focus.id).toBe('Task_1');
    expect(result.before[0].nodes.at(-1)?.id).toBe('Task_1');
    expect(result.after[0].nodes[0].id).toBe('Task_1');
    expect(result.truncated).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- test/query/trace.test.ts test/query/context.test.ts
```

Expected: FAIL with module-not-found for traversal modules or missing `cycle.bpmn`.

- [ ] **Step 3: Create cycle fixture and traversal helper**

Create `test/fixtures/cycle.bpmn` with `StartEvent_1 -> Task_A -> Task_B -> Task_A` and `Task_B -> EndEvent_1`.

Implement `trace` with DFS over `outgoingByNodeId` or `incomingByNodeId`; include the repeated node once, mark `cycleDetected: true`, then stop that branch. Implement `getContext` by calling traversal backward and forward around the focus element and including boundary event target paths when present.

- [ ] **Step 4: Add CLI command smoke tests**

Add CLI smoke tests for `trace` and `context`:

```ts
it('prints trace envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'trace', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1']);
  expect(JSON.parse(stdout)).toMatchObject({ ok: true, command: 'trace', result: { from: { id: 'StartEvent_1' } } });
});

it('prints context envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'context', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1']);
  expect(JSON.parse(stdout)).toMatchObject({ ok: true, command: 'context', result: { focus: { id: 'Task_1' } } });
});
```

- [ ] **Step 5: Run traversal tests and typecheck**

Run:

```bash
npm test -- test/query/trace.test.ts test/query/context.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for traversal, CLI tests, and typecheck exit code `0`.

- [ ] **Step 6: Commit traversal**

```bash
git add src/query/trace.ts src/query/context.ts src/cli/commands/traceCommand.ts src/cli/commands/contextCommand.ts src/cli/main.ts test/fixtures/cycle.bpmn test/query/trace.test.ts test/query/context.test.ts test/cli/cli.test.ts
git commit -m "feat: add cycle-safe context and trace commands"
```

### Task 10: Implementations Query And Extended Validate

**Files:**
- Create: `src/query/implementations.ts`
- Create: `src/cli/commands/implementationsCommand.ts`
- Modify: `src/validate/validateModel.ts`
- Modify: `src/cli/main.ts`
- Create: `test/fixtures/broken-reference.bpmn`
- Create: `test/query/implementations.test.ts`
- Modify: `test/validate/validateModel.test.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing implementations and broken-reference tests**

Create `test/query/implementations.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { listImplementations } from '../../src/query/implementations.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('listImplementations', () => {
  it('groups service tasks, call activities, listeners, and forms', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));
    const result = listImplementations(buildIndexes(model), {});

    expect(result.serviceTasks).toContainEqual(expect.objectContaining({ elementId: 'Service_Delegate', kind: 'delegateExpression' }));
    expect(result.serviceTasks).toContainEqual(expect.objectContaining({ elementId: 'Service_External', kind: 'externalTask', topic: 'score-client' }));
    expect(result.forms).toContainEqual(expect.objectContaining({ elementId: 'User_Approve', kind: 'form', value: 'approve-form' }));
    expect(result.callActivities).toContainEqual(expect.objectContaining({ elementId: 'Call_SubProcess', kind: 'callActivity', value: 'risk-check' }));
  });
});
```

Append to `test/validate/validateModel.test.ts`:

```ts
it('reports broken sequence-flow references as errors', async () => {
  const model = await loadBpmn(fixturePath('broken-reference.bpmn'));
  const result = validateModel(model, buildIndexes(model));

  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(expect.objectContaining({
    code: 'BROKEN_SEQUENCE_FLOW_TARGET',
    elementId: 'Flow_To_Missing'
  }));
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- test/query/implementations.test.ts test/validate/validateModel.test.ts
```

Expected: FAIL with module-not-found for `implementations` or missing `broken-reference.bpmn`.

- [ ] **Step 3: Create broken-reference fixture and implementation query**

Create `test/fixtures/broken-reference.bpmn` with one process containing `Flow_To_Missing` whose `targetRef` points to `Activity_Missing`.

Implement `listImplementations` by grouping `indexes.implementationsByElementId` values into `serviceTasks`, `callActivities`, `listeners`, and `forms`. Add `--type` filtering only for the P0 groups and kinds.

Extend `validateModel` to check broken sequence-flow source/target, boundary `attachedToRef`, incoming/outgoing references, gateway shape, and task missing incoming/outgoing warnings.

- [ ] **Step 4: Add CLI command smoke tests**

Add CLI smoke tests for `implementations` and validation exit code:

```ts
it('prints implementations envelope as JSON', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementations', 'test/fixtures/camunda-implementations.bpmn']);
  expect(JSON.parse(stdout)).toMatchObject({ ok: true, command: 'implementations', result: { serviceTasks: expect.any(Array) } });
});

it('exits 1 for validation errors', async () => {
  await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'validate', 'test/fixtures/broken-reference.bpmn'])).rejects.toMatchObject({
    code: 1,
    stdout: expect.stringContaining('"valid":false')
  });
});
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- test/query/implementations.test.ts test/validate/validateModel.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for implementations, validate, CLI tests, and typecheck exit code `0`.

- [ ] **Step 6: Commit implementations and validation**

```bash
git add src/query/implementations.ts src/cli/commands/implementationsCommand.ts src/validate/validateModel.ts src/cli/main.ts test/fixtures/broken-reference.bpmn test/query/implementations.test.ts test/validate/validateModel.test.ts test/cli/cli.test.ts
git commit -m "feat: add implementations and reference validation"
```

---

## P0-C Distribution, Docs, And Legacy CLI

### Task 11: Legacy `to-json` CLI Command

**Files:**
- Create: `src/cli/commands/toJsonCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing `to-json` CLI tests**

Append to `test/cli/cli.test.ts`:

```ts
it('prints raw legacy to-json output without envelope', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'to-json', 'test/fixtures/simple-linear.bpmn']);
  const parsed = JSON.parse(stdout);

  expect(parsed.ok).toBeUndefined();
  expect(parsed.processes[0].id).toBe('Process_SimpleLinear');
});

it('prints raw converter config without envelope', async () => {
  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'to-json', '--print-config', 'optimized']);
  const parsed = JSON.parse(stdout);

  expect(parsed.extends).toBeUndefined();
  expect(parsed.optimizations.enabled).toContain('compactElementMeta');
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `to-json` command is not routed.

- [ ] **Step 3: Implement raw-output `to-json` command**

Create `src/cli/commands/toJsonCommand.ts` to call `convertBpmnToJson`, `getPresetConfig`, and `resolveCompressionConfig` from `src/legacy`. It must:

- accept `bpmn-agent-cli to-json <file> [--preset base|optimized]`
- accept `bpmn-agent-cli to-json --print-config optimized`
- write raw JSON to stdout without the success envelope
- write to `-o` or `--output` if provided
- use common error envelope for errors

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npm test -- test/legacy/convert.test.ts test/cli/cli.test.ts
npm run typecheck
```

Expected: PASS for legacy converter, CLI tests, and typecheck exit code `0`.

- [ ] **Step 5: Commit legacy command**

```bash
git add src/cli/commands/toJsonCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add legacy raw to-json command"
```

### Task 12: Extension Bundle And Bundle Smoke Tests

**Files:**
- Create: `scripts/build-extension.mjs`
- Create: `test/cli/bundle.test.ts`
- Create: `dist/extension/bpmn-agent-cli.cjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing bundle smoke test**

Create `test/cli/bundle.test.ts`:

```ts
import { cp, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('extension bundle', () => {
  it('runs from a temp directory without node_modules', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bpmn-agent-cli-bundle-'));
    await cp('dist/extension/bpmn-agent-cli.cjs', join(dir, 'bpmn-agent-cli.cjs'));
    await cp('test/fixtures/simple-linear.bpmn', join(dir, 'simple-linear.bpmn'));

    const { stdout } = await execFileAsync('node', [join(dir, 'bpmn-agent-cli.cjs'), 'overview', join(dir, 'simple-linear.bpmn')], {
      cwd: dir
    });

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'overview',
      result: { definitions: { id: 'Definitions_SimpleLinear' } }
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- test/cli/bundle.test.ts
```

Expected: FAIL because `dist/extension/bpmn-agent-cli.cjs` does not exist.

- [ ] **Step 3: Implement bundle script**

Create `scripts/build-extension.mjs`:

```js
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist/extension', { recursive: true });

await build({
  entryPoints: ['src/cli/main.ts'],
  outfile: 'dist/extension/bpmn-agent-cli.cjs',
  bundle: true,
  platform: 'node',
  target: ['node20'],
  format: 'cjs',
  banner: { js: '#!/usr/bin/env node' },
  external: [],
  logLevel: 'info'
});
```

If `camunda-bpmn-moddle/resources/camunda.json` is not bundled by esbuild because it is loaded with `createRequire`, replace the runtime require in `src/bpmn/moddle.ts` with an import assertion-compatible JSON import or an in-source generated descriptor module during this task.

- [ ] **Step 4: Build bundle and run smoke tests**

Run:

```bash
npm run build
npm run build:extension
npm test -- test/cli/bundle.test.ts
```

Expected: build exits `0`; bundle test passes from temp directory without `node_modules`.

- [ ] **Step 5: Commit bundle**

```bash
git add scripts/build-extension.mjs package.json package-lock.json dist/extension/bpmn-agent-cli.cjs test/cli/bundle.test.ts
git commit -m "feat: add self-contained extension bundle"
```

### Task 13: Qwen And Claude Agent Metadata

**Files:**
- Create: `qwen-extension.json`
- Create: `QWEN.md`
- Create: `commands/bpmn-agent-cli.md`
- Create: `skills/bpmn-agent-cli/SKILL.md`
- Create: `.claude-plugin/marketplace.json`
- Create: `.claude-plugin/plugin.json`
- Create: `test/plugin-package.test.ts`

- [ ] **Step 1: Write failing metadata tests**

Create `test/plugin-package.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('agent extension metadata', () => {
  it('declares Qwen extension files', async () => {
    const manifest = JSON.parse(await readFile('qwen-extension.json', 'utf8'));

    expect(manifest).toEqual({
      name: 'bpmn-agent-cli',
      version: '0.1.0',
      contextFileName: 'QWEN.md',
      commands: 'commands',
      skills: 'skills'
    });
  });

  it('declares Claude plugin marketplace files', async () => {
    const marketplace = JSON.parse(await readFile('.claude-plugin/marketplace.json', 'utf8'));
    const plugin = JSON.parse(await readFile('.claude-plugin/plugin.json', 'utf8'));

    expect(marketplace.plugins[0]).toMatchObject({
      name: 'bpmn-agent-cli',
      source: './'
    });
    expect(plugin).toMatchObject({
      name: 'bpmn-agent-cli',
      skills: './skills/'
    });
  });

  it('documents bundled CLI invocation for agents', async () => {
    const command = await readFile('commands/bpmn-agent-cli.md', 'utf8');
    const skill = await readFile('skills/bpmn-agent-cli/SKILL.md', 'utf8');

    expect(command).toContain('${extensionPath}');
    expect(command).toContain('dist/extension/bpmn-agent-cli.cjs');
    expect(skill).toContain('bpmn-agent-cli overview');
    expect(skill).toContain('Prefer specialized CLI queries');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- test/plugin-package.test.ts
```

Expected: FAIL because extension metadata files do not exist.

- [ ] **Step 3: Create Qwen, Claude, command, and skill files**

Create `qwen-extension.json` exactly:

```json
{
  "name": "bpmn-agent-cli",
  "version": "0.1.0",
  "contextFileName": "QWEN.md",
  "commands": "commands",
  "skills": "skills"
}
```

Create `.claude-plugin/marketplace.json`:

```json
{
  "name": "bpmn-agent-tools",
  "owner": {
    "name": "killreal777"
  },
  "plugins": [
    {
      "name": "bpmn-agent-cli",
      "description": "Agent-friendly CLI and skill for reading BPMN files.",
      "source": "./"
    }
  ]
}
```

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "bpmn-agent-cli",
  "displayName": "BPMN Agent CLI",
  "description": "Agent-friendly CLI and skill for reading BPMN files.",
  "version": "0.1.0",
  "author": {
    "name": "killreal777"
  },
  "skills": "./skills/",
  "commands": "./commands/"
}
```

Create `commands/bpmn-agent-cli.md` with an agent command that invokes:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs"
```

Create `skills/bpmn-agent-cli/SKILL.md` with frontmatter:

```yaml
---
name: bpmn-agent-cli
summary: Read and analyze BPMN 2.0 files through the local bpmn-agent-cli CLI.
description: Use this skill when working with .bpmn files. Prefer specialized CLI queries over reading raw BPMN XML.
---
```

The skill must instruct agents to start with `overview`, use `find`, `element`, `context`, `gateway`, `trace`, `implementations`, and `validate`, and not manually rewrite BPMN XML.

- [ ] **Step 4: Run metadata tests and Claude validation if available**

Run:

```bash
npm test -- test/plugin-package.test.ts
if command -v claude >/dev/null 2>&1; then claude plugin validate .; else echo "SKIP: claude plugin validate . because claude is not installed"; fi
```

Expected: metadata tests pass. Claude validation passes when `claude` exists, otherwise the skip message is printed.

- [ ] **Step 5: Commit agent metadata**

```bash
git add qwen-extension.json QWEN.md commands skills .claude-plugin test/plugin-package.test.ts
git commit -m "feat: add qwen and claude agent metadata"
```

### Task 14: Documentation

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `docs/CLI.md`
- Create: `docs/OUTPUT_CONTRACTS.md`
- Create: `docs/ROADMAP.md`
- Create: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs coverage test**

Create `test/docs.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('documentation', () => {
  it('documents installation, CLI commands, contracts, and roadmap', async () => {
    const readme = await readFile('README.md', 'utf8');
    const agents = await readFile('AGENTS.md', 'utf8');
    const cli = await readFile('docs/CLI.md', 'utf8');
    const contracts = await readFile('docs/OUTPUT_CONTRACTS.md', 'utf8');
    const roadmap = await readFile('docs/ROADMAP.md', 'utf8');

    expect(readme).toContain('bpmn-agent-cli');
    expect(readme).toContain('/extensions install https://github.com/killreal777/bpmn-agent-cli');
    expect(readme).toContain('/plugin marketplace add killreal777/bpmn-agent-cli');
    expect(agents).toContain('Do not implement a custom BPMN parser');
    expect(agents).toContain('npm test');
    expect(cli).toContain('bpmn-agent-cli overview process.bpmn');
    expect(cli).toContain('bpmn-agent-cli to-json process.bpmn --preset optimized');
    expect(contracts).toContain('ELEMENT_NOT_FOUND');
    expect(contracts).toContain('ValidateResult');
    expect(roadmap).toContain('P0');
    expect(roadmap).toContain('P1');
    expect(roadmap).toContain('P2');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL because docs files do not exist.

- [ ] **Step 3: Write docs**

Create docs that reflect the final design spec:

- `README.md`: project goal, development install, Qwen install, Claude install, command examples, MVP status, runtime constraints, and relationship to `bpmn-to-json`.
- `AGENTS.md`: architecture rules, runtime rules, testing commands, no network/LLM runtime rule, no custom parser rule, CLI wiring separation, and verification commands.
- `docs/CLI.md`: every P0 command with command-first examples.
- `docs/OUTPUT_CONTRACTS.md`: success envelope, error envelope, raw `to-json` exception, result schemas, error codes, exit codes.
- `docs/ROADMAP.md`: P0/P1/P2/P3 scope from the requirements.

- [ ] **Step 4: Run docs tests**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: PASS for docs coverage test.

- [ ] **Step 5: Commit docs**

```bash
git add README.md AGENTS.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md test/docs.test.ts
git commit -m "docs: document bpmn agent cli usage and contracts"
```

### Task 15: Final Verification And MVP Acceptance

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run the full automated verification suite**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run built CLI smoke commands**

Run:

```bash
node dist/cli/main.js overview docs/bpmn-examples/loan-application-process.bpmn --pretty
node dist/cli/main.js find docs/bpmn-examples/loan-application-process.bpmn --query "loan" --pretty
node dist/cli/main.js validate docs/bpmn-examples/loan-application-process.bpmn --pretty
node dist/cli/main.js to-json docs/bpmn-examples/loan-application-process.bpmn --preset optimized > tmp/loan.optimized.json
node -e "JSON.parse(require('node:fs').readFileSync('tmp/loan.optimized.json', 'utf8')); console.log('ok')"
```

Expected: first three commands print JSON envelopes; `to-json` writes raw valid JSON; final node command prints `ok`.

- [ ] **Step 3: Run bundle smoke commands from a temp directory**

Run:

```bash
tmp_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$tmp_dir/bpmn-agent-cli.cjs"
cp test/fixtures/simple-linear.bpmn "$tmp_dir/simple-linear.bpmn"
node "$tmp_dir/bpmn-agent-cli.cjs" overview "$tmp_dir/simple-linear.bpmn" --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" find "$tmp_dir/simple-linear.bpmn" --query work --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" validate "$tmp_dir/simple-linear.bpmn" --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" to-json "$tmp_dir/simple-linear.bpmn" > "$tmp_dir/simple.json"
node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8')); console.log('ok')" "$tmp_dir/simple.json"
```

Expected: all commands exit `0`; final node command prints `ok`.

- [ ] **Step 4: Run optional Claude validation**

Run:

```bash
if command -v claude >/dev/null 2>&1; then claude plugin validate .; else echo "SKIP: claude plugin validate . because claude is not installed"; fi
```

Expected: validation exits `0` when `claude` exists, otherwise skip message is printed.

- [ ] **Step 5: Record skipped manual install checks if tools are unavailable**

If `qwen` is unavailable, record this in the final response:

```text
Skipped Qwen manual install smoke because qwen is not installed: /extensions install https://github.com/killreal777/bpmn-agent-cli
```

If `claude` is unavailable, record this in the final response:

```text
Skipped Claude manual install smoke because claude is not installed: /plugin marketplace add killreal777/bpmn-agent-cli
```

- [ ] **Step 6: Commit verification fixes**

If verification required fixes, commit them:

```bash
git add .
git commit -m "fix: complete p0 mvp verification"
```

If no files changed after verification, do not create an empty commit.
