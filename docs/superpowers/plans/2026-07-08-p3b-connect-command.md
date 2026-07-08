# P3-B Connect Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `connect`, a structural write command that creates one sequence flow between two existing flow nodes.

**Architecture:** Put pure XML patching in `src/write/connectElements.ts`, CLI orchestration in `src/cli/commands/connectCommand.ts`, and route from `src/cli/main.ts`. Follow existing dry-run/write safety and include `DI_NOT_UPDATED`.

**Tech Stack:** TypeScript, Node.js, Vitest, BPMN indexes, `bpmn-moddle` validation, existing CLI envelope utilities.

---

## File Structure

- Create `src/write/connectElements.ts`: pure patcher, endpoint validation, XML edits, result schema.
- Create `test/write/connectElements.test.ts`: focused patcher tests.
- Create `src/cli/commands/connectCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- Modify `src/cli/main.ts`: route `connect`.
- Modify `test/cli/cli.test.ts`: dry-run/write/error smoke tests.
- Modify docs, roadmap, README, skill, docs test.
- Modify `dist/extension/bpmn-agent-cli.cjs`: regenerated bundle.

## Task 1: Pure Connect Patcher

**Files:**
- Create: `src/write/connectElements.ts`
- Test: `test/write/connectElements.test.ts`

- [ ] **Step 1: Write failing tests**

Test `connectElementsXml` with `simple-linear.bpmn`:

```ts
const plan = connectElementsXml({
  xml: model.xml,
  indexes: buildIndexes(model),
  sourceId: 'StartEvent_1',
  targetId: 'EndEvent_1',
  flowId: 'Flow_Start_To_End',
  name: 'skip work',
  file: model.filePath
});
expect(plan.result.flow).toMatchObject({
  id: 'Flow_Start_To_End',
  sourceId: 'StartEvent_1',
  targetId: 'EndEvent_1',
  name: 'skip work'
});
expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
expect(plan.xml).toContain('<bpmn:outgoing>Flow_Start_To_End</bpmn:outgoing>');
expect(plan.xml).toContain('<bpmn:incoming>Flow_Start_To_End</bpmn:incoming>');
expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Start_To_End" name="skip work" sourceRef="StartEvent_1" targetRef="EndEvent_1" />');
await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
```

Also test duplicate flow id and sequence-flow endpoint rejection.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/write/connectElements.test.ts
```

Expected: FAIL because `src/write/connectElements.ts` does not exist.

- [ ] **Step 3: Implement patcher**

Implement `connectElementsXml(args)`:

- validate source and target exist in `indexes.byId`
- reject endpoints with type `bpmn:SequenceFlow`
- reject duplicate flow id
- append outgoing to source before its closing tag
- append incoming to target before its closing tag
- insert new sequence flow after the source element closing tag
- return `ConnectResult` with `DI_NOT_UPDATED`

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/connectElements.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/write/connectElements.ts test/write/connectElements.test.ts
git commit -m "feat: add connect structural patcher"
git push origin main
```

## Task 2: CLI Command

**Files:**
- Create: `src/cli/commands/connectCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests for dry-run, `--write -o`, and `-o` without `--write`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL with `INVALID_COMMAND` for `connect`.

- [ ] **Step 3: Implement command**

Follow the existing write-command pattern:

- require file, `--from`, `--to`, `--id`
- parse optional `--name`
- reject `-o` without `--write`
- load BPMN, build indexes, patch, validate, optionally write
- return success envelope

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/connectElements.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/connectCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add connect cli command"
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

Add expectations for `bpmn-agent-cli connect process.bpmn --from Task_A --to Task_B --id Flow_A_B` and `ConnectResult`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/docs.test.ts
```

- [ ] **Step 3: Update docs and skill**

Document usage, result contract, dry-run/write behavior, and `DI_NOT_UPDATED`.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/docs.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p3b connect command"
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
node dist/cli/main.js connect "$tmp_dir/process.bpmn" --from StartEvent_1 --to EndEvent_1 --id Flow_Start_To_End --name skip --pretty >/tmp/bpmn-connect-dry.json
node -e "const p=require('/tmp/bpmn-connect-dry.json'); if(!p.ok||p.command!=='connect'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js connect "$tmp_dir/process.bpmn" --from StartEvent_1 --to EndEvent_1 --id Flow_Start_To_End --write -o "$tmp_dir/connected.bpmn" >/tmp/bpmn-connect-write.json
node -e "const p=require('/tmp/bpmn-connect-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/connected.bpmn" >/tmp/bpmn-connect-validate.json
node -e "const p=require('/tmp/bpmn-connect-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
```

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p3b"
git push origin main
```

