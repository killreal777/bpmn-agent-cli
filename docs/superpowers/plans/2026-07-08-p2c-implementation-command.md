# P2-C Implementation Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the safe write `implementation` command for one supported runtime implementation attribute on one BPMN element.

**Architecture:** Put pure XML patching in `src/write/implementationElement.ts`, CLI orchestration in `src/cli/commands/implementationCommand.ts`, and route from `src/cli/main.ts`. Follow the existing `rename` and `documentation` dry-run/write model.

**Tech Stack:** TypeScript, Node.js, Vitest, `bpmn-moddle`, `camunda-bpmn-moddle`, existing CLI output envelope utilities.

---

## File Structure

- Create `src/write/implementationElement.ts`: pure patcher, supported kind validation, XML attribute escaping, optional Camunda namespace insertion, result schema.
- Create `test/write/implementationElement.test.ts`: TDD coverage for pure patching behavior.
- Create `src/cli/commands/implementationCommand.ts`: argument validation, load/index/patch/validate/write/envelope.
- Modify `src/cli/main.ts`: route `implementation`.
- Modify `test/cli/cli.test.ts`: CLI dry-run/write/error smoke tests.
- Modify `docs/CLI.md`, `docs/OUTPUT_CONTRACTS.md`, `docs/ROADMAP.md`, `README.md`, `skills/bpmn-agent-cli/SKILL.md`, `test/docs.test.ts`: public docs and skill updates.
- Modify `dist/extension/bpmn-agent-cli.cjs`: regenerated bundle after verification.

## Task 1: Pure Implementation Patcher

**Files:**
- Create: `src/write/implementationElement.ts`
- Test: `test/write/implementationElement.test.ts`

- [ ] **Step 1: Write failing tests**

Create `test/write/implementationElement.test.ts` with tests that import `setImplementationXml`, load fixtures through `loadBpmn`, and assert:

```ts
const plan = setImplementationXml({
  xml: model.xml,
  indexes: buildIndexes(model),
  elementId: 'Service_Delegate',
  kind: 'delegateExpression',
  value: '${newDelegate}',
  file: model.filePath
});

expect(plan.result).toMatchObject({
  dryRun: true,
  written: false,
  kind: 'delegateExpression',
  before: { 'camunda:delegateExpression': '${checkClientDelegate}' },
  after: { 'camunda:delegateExpression': '${newDelegate}' }
});
expect(plan.xml).toContain('camunda:delegateExpression="${newDelegate}"');
```

Also test:

```ts
expect(plan.xml).toContain('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"');
expect(plan.xml).toContain('camunda:formKey="review-form"');
expect(plan.result.diff[0]).toMatchObject({ op: 'add', path: '/elements/Task_1/camunda:formKey' });
```

And:

```ts
expect(plan.xml).toContain('camunda:type="external"');
expect(plan.xml).toContain('camunda:topic="score-v2"');
expect(plan.result.diff).toHaveLength(2);
```

And unknown id / unsupported kind throw `BpmnCliError`.

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/write/implementationElement.test.ts
```

Expected: FAIL because `src/write/implementationElement.ts` does not exist.

- [ ] **Step 3: Implement minimal patcher**

Implement `setImplementationXml(args)`:

```ts
export type SupportedImplementationPatchKind =
  | 'delegateExpression'
  | 'class'
  | 'expression'
  | 'externalTask'
  | 'form'
  | 'callActivity';
```

Map kinds to XML attributes:

```ts
delegateExpression -> ['camunda:delegateExpression']
class -> ['camunda:class']
expression -> ['camunda:expression']
externalTask -> ['camunda:type', 'camunda:topic'] with values ['external', args.value]
form -> ['camunda:formKey']
callActivity -> ['calledElement']
```

Patch only the target opening tag, escape attribute values, add missing attributes before `>` or `/>`, and add Camunda namespace to `bpmn:definitions` only when writing a `camunda:*` attribute and the XML lacks `xmlns:camunda=`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/write/implementationElement.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/write/implementationElement.ts test/write/implementationElement.test.ts
git commit -m "feat: add implementation xml patcher"
git push origin main
```

## Task 2: CLI Command

**Files:**
- Create: `src/cli/commands/implementationCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests to `test/cli/cli.test.ts`:

```ts
it('prints implementation dry-run envelope without modifying input', async () => {
  const input = await mkdtemp(join(tmpdir(), 'bpmn-implementation-'));
  const file = join(input, 'process.bpmn');
  await copyFile('test/fixtures/camunda-implementations.bpmn', file);
  const before = await readFile(file, 'utf8');

  const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementation', file, '--id', 'Service_Delegate', '--kind', 'delegateExpression', '--value', '${newDelegate}']);

  const parsed = JSON.parse(stdout);
  expect(parsed).toMatchObject({ ok: true, command: 'implementation', result: { dryRun: true, written: false, kind: 'delegateExpression' } });
  expect(await readFile(file, 'utf8')).toBe(before);
});
```

Also add write-to-output and `-o` without `--write` error tests.

- [ ] **Step 2: Run CLI tests to verify RED**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL with `INVALID_COMMAND` for `implementation`.

- [ ] **Step 3: Implement command and route**

Implement `implementationCommand(args)` using the same structure as `renameCommand` and `documentationCommand`:

- require file, `--id`, `--kind`, `--value`
- reject `-o` unless `--write`
- call `loadBpmn`, `buildIndexes`, `setImplementationXml`
- validate patched XML with `createBpmnModdle().fromXML`
- write only if `--write`
- return `successEnvelope({ command: 'implementation', file, result })`

Add the import and route in `src/cli/main.ts` before `to-json`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/write/implementationElement.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/implementationCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add implementation cli command"
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
expect(cli).toContain('bpmn-agent-cli implementation process.bpmn --id Service_1 --kind delegateExpression --value');
expect(contracts).toContain('ImplementationPatchResult');
```

- [ ] **Step 2: Run docs test to verify RED**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL because docs do not mention the new command yet.

- [ ] **Step 3: Update docs**

Document:

- CLI examples for dry-run, `--write`, and `--write -o`
- supported kinds
- `ImplementationPatchResult`
- P2-C implemented in roadmap
- skill workflow item for dry-run implementation updates

- [ ] **Step 4: Run docs test to verify GREEN**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p2c implementation command"
git push origin main
```

## Task 4: Verification And Bundle

**Files:**
- Modify: `dist/extension/bpmn-agent-cli.cjs`

- [ ] **Step 1: Run full verification**

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run bundled smoke**

```bash
tmp_dir="$(mktemp -d)"
cp test/fixtures/camunda-implementations.bpmn "$tmp_dir/process.bpmn"
node dist/cli/main.js implementation "$tmp_dir/process.bpmn" --id Service_Delegate --kind delegateExpression --value '${newDelegate}' --pretty >/tmp/bpmn-implementation-dry.json
node -e "const p=require('/tmp/bpmn-implementation-dry.json'); if(!p.ok||p.command!=='implementation'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js implementation "$tmp_dir/process.bpmn" --id Service_Delegate --kind delegateExpression --value '${newDelegate}' --write -o "$tmp_dir/implemented.bpmn" >/tmp/bpmn-implementation-write.json
node -e "const p=require('/tmp/bpmn-implementation-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/implemented.bpmn" >/tmp/bpmn-implementation-validate.json
node -e "const p=require('/tmp/bpmn-implementation-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
bundle_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$bundle_dir/bpmn-agent-cli.cjs"
node "$bundle_dir/bpmn-agent-cli.cjs" implementation "$tmp_dir/process.bpmn" --id Service_Delegate --kind delegateExpression --value '${bundleDelegate}' >/tmp/bpmn-implementation-bundle.json
node -e "const p=require('/tmp/bpmn-implementation-bundle.json'); if(!p.ok||p.command!=='implementation'||!p.result.dryRun) process.exit(1)"
```

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p2c"
git push origin main
```

