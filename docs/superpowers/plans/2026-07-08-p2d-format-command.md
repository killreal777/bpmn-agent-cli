# P2-D Format Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the safe write `format` command that serializes BPMN through `bpmn-moddle` with formatting enabled.

**Architecture:** Put model formatting in `src/write/formatBpmn.ts`, CLI orchestration in `src/cli/commands/formatCommand.ts`, and route from `src/cli/main.ts`. Follow the existing P2 dry-run/write command shape.

**Tech Stack:** TypeScript, Node.js, Vitest, `bpmn-moddle`, `camunda-bpmn-moddle`, existing CLI envelope utilities.

---

## File Structure

- Create `src/write/formatBpmn.ts`: async model serializer and `FormatResult`.
- Create `test/write/formatBpmn.test.ts`: focused formatter tests.
- Create `src/cli/commands/formatCommand.ts`: parse options, call formatter, validate formatted XML, optionally write.
- Modify `src/cli/main.ts`: route `format`.
- Modify `test/cli/cli.test.ts`: CLI dry-run/write/error smoke tests.
- Modify docs, roadmap, README, skill, and docs test.
- Modify `dist/extension/bpmn-agent-cli.cjs`: regenerated bundle.

## Task 1: Pure Formatter

**Files:**
- Create: `src/write/formatBpmn.ts`
- Test: `test/write/formatBpmn.test.ts`

- [ ] **Step 1: Write failing tests**

Create tests that load `test/fixtures/simple-linear.bpmn`, call `formatBpmnModel`, and assert:

```ts
expect(plan.result).toMatchObject({
  dryRun: true,
  written: false,
  file: model.filePath,
  outputFile: null
});
expect(plan.result.after.bytes).toBeGreaterThan(0);
expect(plan.xml).toContain('<bpmn:definitions');
await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
```

Also assert `written` and `outputFile` reflect provided options.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/write/formatBpmn.test.ts
```

Expected: FAIL because `src/write/formatBpmn.ts` does not exist.

- [ ] **Step 3: Implement formatter**

Implement:

```ts
export async function formatBpmnModel(args: FormatBpmnArgs): Promise<FormatBpmnPlan>
```

Use `createBpmnModdle().toXML(args.model.definitions, { format: true })`, append a trailing newline if missing, and return `FormatResult` with byte counts, `changed`, dry-run/write flags, and parser warnings from the loaded model.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/formatBpmn.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/write/formatBpmn.ts test/write/formatBpmn.test.ts
git commit -m "feat: add bpmn formatter"
git push origin main
```

## Task 2: CLI Command

**Files:**
- Create: `src/cli/commands/formatCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add CLI tests for:

- `format <file>` dry-run envelope and unchanged input.
- `format <file> --write -o <output>` writes output and returns `written: true`.
- `format <file> -o <output>` exits `2` with `INVALID_OPTION_VALUE`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL with `INVALID_COMMAND` for `format`.

- [ ] **Step 3: Implement command**

Implement `formatCommand(args)`:

- require file
- parse `--write`
- reject `-o` without `--write`
- load BPMN
- call `formatBpmnModel`
- validate formatted XML with `createBpmnModdle().fromXML`
- write only when `--write`
- return `successEnvelope({ command: 'format', file, result })`

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/formatBpmn.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/formatCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add format cli command"
git push origin main
```

## Task 3: Docs And Skill

**Files:**
- Modify: `README.md`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Add expectations for:

```ts
expect(cli).toContain('bpmn-agent-cli format process.bpmn --write -o tmp/formatted.bpmn');
expect(contracts).toContain('FormatResult');
```

- [ ] **Step 2: Run RED**

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL until docs are updated.

- [ ] **Step 3: Update docs and skill**

Document CLI examples, dry-run/write behavior, `FormatResult`, and P2-D roadmap completion.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/docs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p2d format command"
git push origin main
```

## Task 4: Verification And Bundle

**Files:**
- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Full verification**

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

- [ ] **Step 2: Bundled smoke**

```bash
tmp_dir="$(mktemp -d)"
cp test/fixtures/simple-linear.bpmn "$tmp_dir/process.bpmn"
node dist/cli/main.js format "$tmp_dir/process.bpmn" --pretty >/tmp/bpmn-format-dry.json
node -e "const p=require('/tmp/bpmn-format-dry.json'); if(!p.ok||p.command!=='format'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js format "$tmp_dir/process.bpmn" --write -o "$tmp_dir/formatted.bpmn" >/tmp/bpmn-format-write.json
node -e "const p=require('/tmp/bpmn-format-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/formatted.bpmn" >/tmp/bpmn-format-validate.json
node -e "const p=require('/tmp/bpmn-format-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
bundle_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$bundle_dir/bpmn-agent-cli.cjs"
node "$bundle_dir/bpmn-agent-cli.cjs" format "$tmp_dir/process.bpmn" >/tmp/bpmn-format-bundle.json
node -e "const p=require('/tmp/bpmn-format-bundle.json'); if(!p.ok||p.command!=='format'||!p.result.dryRun) process.exit(1)"
```

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p2d"
git push origin main
```

