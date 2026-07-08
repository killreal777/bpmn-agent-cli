# P1-C Export Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `export` for compact BPMN context in markdown, text, or JSON.

**Architecture:** Build section data from existing read-only query functions, render markdown/text through pure renderers, and wire CLI output through `exportCommand`. JSON export uses the existing success envelope; markdown/text are raw successful payloads.

**Tech Stack:** TypeScript, Node.js, Vitest, existing BPMN query modules, `fs/promises` for explicit `-o` writes.

---

## Task 1: Export Model And Renderers

**Files:**

- Create: `src/query/exportModel.ts`
- Create: `src/export/renderMarkdown.ts`
- Create: `src/export/renderText.ts`
- Create: `test/query/exportModel.test.ts`
- Create: `test/export/renderExport.test.ts`

- [ ] **Step 1: Write failing model tests**

Create `test/query/exportModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildExportModel } from '../../src/query/exportModel.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('buildExportModel', () => {
  it('builds selected overview section only', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = buildExportModel(model, ['overview']);

    expect(result.sections).toEqual(['overview']);
    expect(result.overview?.definitions.id).toBe('Definitions_SimpleLinear');
    expect(result.events).toBeUndefined();
  });

  it('builds all sections in deterministic order', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = buildExportModel(model, ['overview', 'participants', 'lanes', 'events', 'subprocess', 'implementations']);

    expect(result.sections).toEqual(['overview', 'participants', 'lanes', 'events', 'subprocess', 'implementations']);
    expect(result.events?.events.some((event) => event.id === 'Boundary_Timer')).toBe(true);
  });
});
```

- [ ] **Step 2: Write failing renderer tests**

Create `test/export/renderExport.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { renderMarkdown } from '../../src/export/renderMarkdown.js';
import { renderText } from '../../src/export/renderText.js';
import { buildExportModel } from '../../src/query/exportModel.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('export renderers', () => {
  it('renders markdown without raw XML', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const markdown = renderMarkdown(buildExportModel(model, ['overview', 'events']));

    expect(markdown).toContain('# BPMN Export');
    expect(markdown).toContain('## Events');
    expect(markdown).toContain('Boundary_Timer');
    expect(markdown).not.toContain('<bpmn:');
  });

  it('renders text without raw XML', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const text = renderText(buildExportModel(model, ['overview']));

    expect(text).toContain('BPMN Export');
    expect(text).toContain('OVERVIEW');
    expect(text).toContain('Definitions_SimpleLinear');
    expect(text).not.toContain('<bpmn:');
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
npm test -- test/query/exportModel.test.ts test/export/renderExport.test.ts
```

Expected: FAIL because export modules do not exist.

- [ ] **Step 4: Implement export model**

Create `src/query/exportModel.ts` with:

```ts
import type { LoadedBpmnModel } from '../bpmn/types.js';
import { buildIndexes } from '../index/buildIndexes.js';
import { getEvents } from './events.js';
import { getImplementations } from './implementations.js';
import { getLanes } from './lanes.js';
import { getOverview } from './overview.js';
import { getParticipants } from './participants.js';
import { getSubprocesses } from './subprocess.js';
```

Define `ExportSection`, `EXPORT_SECTIONS`, `ExportResult`, and `buildExportModel(model, sections)`.

- [ ] **Step 5: Implement renderers**

Create compact deterministic renderers:

- `renderMarkdown(model)` returns sections with headings and bullets.
- `renderText(model)` returns uppercase section labels and line summaries.
- Include overview definitions/processes, participants, lane ids, event ids/categories, subprocess ids, and implementation element ids.

- [ ] **Step 6: Run tests to verify pass**

Run:

```bash
npm test -- test/query/exportModel.test.ts test/export/renderExport.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit model/renderers**

```bash
git add src/query/exportModel.ts src/export/renderMarkdown.ts src/export/renderText.ts test/query/exportModel.test.ts test/export/renderExport.test.ts
git commit -m "feat: add export model renderers"
```

## Task 2: Export CLI

**Files:**

- Create: `src/cli/commands/exportCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests:

```ts
  it('prints markdown export without envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'markdown', '--section', 'overview']);

    expect(stdout).toContain('# BPMN Export');
    expect(stdout).toContain('Definitions_SimpleLinear');
    expect(JSON.parse.bind(JSON, stdout)).toThrow();
  });

  it('prints json export envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'json', '--section', 'overview']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'export',
      result: { format: 'json', sections: ['overview'] }
    });
  });

  it('writes export output to explicit path', async () => {
    const output = 'tmp/export-test.md';
    await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'markdown', '--section', 'overview', '-o', output]);
    const written = await import('node:fs/promises').then((fs) => fs.readFile(output, 'utf8'));

    expect(written).toContain('# BPMN Export');
  });
```

- [ ] **Step 2: Run CLI test to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `export` is unknown.

- [ ] **Step 3: Implement export command**

Create `src/cli/commands/exportCommand.ts`:

- require file
- parse `--format`, default `markdown`
- parse `--section`, default `all`
- validate allowed values
- load BPMN and build export model
- for JSON: `writeJson(successEnvelope(...), pretty)` in command or return envelope to main
- for markdown/text: write raw payload to stdout or explicit `-o`
- on write failure throw `BpmnCliError('OUTPUT_WRITE_ERROR', ...)`

Modify `src/cli/main.ts` to route `export` before generic envelope writing assumptions.

- [ ] **Step 4: Run CLI checks**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit CLI**

```bash
git add src/cli/commands/exportCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add export cli command"
```

## Task 3: Docs And Skill

**Files:**

- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `README.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Add expectations for `bpmn-agent-cli export process.bpmn --format markdown` and `ExportResult`.

- [ ] **Step 2: Update docs and skill**

Document `export`, formats, raw markdown/text success behavior, JSON envelope behavior, `-o`, and roadmap P1-C implemented.

- [ ] **Step 3: Run docs test and commit**

```bash
npm test -- test/docs.test.ts
git add docs README.md skills test/docs.test.ts
git commit -m "docs: document p1c export command"
```

## Task 4: Verification, Bundle, Push

- [ ] **Step 1: Run verification**

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

- [ ] **Step 2: Run smoke**

```bash
node dist/cli/main.js export test/fixtures/simple-linear.bpmn --format markdown --section overview
node dist/cli/main.js export test/fixtures/simple-linear.bpmn --format json --section overview
```

- [ ] **Step 3: Commit bundle and push**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p1c"
git push origin main
```

