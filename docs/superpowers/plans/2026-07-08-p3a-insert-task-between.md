# P3-A Insert Task Between Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `insert-task-between`, a structural write command that splits one sequence flow and inserts one task-like element.

**Architecture:** Keep structural patching in `src/write/insertTaskBetween.ts`, CLI orchestration in `src/cli/commands/insertTaskBetweenCommand.ts`, and route from `src/cli/main.ts`. Follow P2 dry-run/write safety, but include explicit `DI_NOT_UPDATED` warning because P3-A does not update BPMNDI.

**Tech Stack:** TypeScript, Node.js, Vitest, existing BPMN indexes, `bpmn-moddle` validation, existing CLI envelope utilities.

---

## File Structure

- Create `src/write/insertTaskBetween.ts`: pure patcher, id validation, XML edits, result schema.
- Create `test/write/insertTaskBetween.test.ts`: focused structural patcher tests.
- Create `src/cli/commands/insertTaskBetweenCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- Modify `src/cli/main.ts`: route `insert-task-between`.
- Modify `test/cli/cli.test.ts`: dry-run/write/error smoke tests.
- Modify docs, roadmap, README, skill, docs test.
- Modify `dist/extension/bpmn-agent-cli.cjs`: regenerated bundle.

## Task 1: Pure Structural Patcher

**Files:**
- Create: `src/write/insertTaskBetween.ts`
- Test: `test/write/insertTaskBetween.test.ts`

- [ ] **Step 1: Write failing tests**

Create tests that load `simple-linear.bpmn`, build indexes, call `insertTaskBetweenXml`, and assert:

```ts
const plan = insertTaskBetweenXml({
  xml: model.xml,
  indexes: buildIndexes(model),
  flowId: 'Flow_Start_To_Task',
  elementId: 'Task_Review',
  name: 'Review',
  type: 'userTask',
  file: model.filePath
});

expect(plan.result).toMatchObject({
  dryRun: true,
  written: false,
  inserted: { id: 'Task_Review', type: 'bpmn:UserTask', name: 'Review' },
  replacedFlow: { id: 'Flow_Start_To_Task', sourceId: 'StartEvent_1', targetId: 'Task_1' }
});
expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
expect(plan.xml).toContain('<bpmn:userTask id="Task_Review" name="Review">');
expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Start_To_Task_to_Task_Review" sourceRef="StartEvent_1" targetRef="Task_Review" />');
expect(plan.xml).toContain('<bpmn:sequenceFlow id="Task_Review_to_Task_1" sourceRef="Task_Review" targetRef="Task_1" />');
await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
```

Also test duplicate new id and unsupported type throw `BpmnCliError`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/write/insertTaskBetween.test.ts
```

Expected: FAIL because `src/write/insertTaskBetween.ts` does not exist.

- [ ] **Step 3: Implement patcher**

Implement `insertTaskBetweenXml(args)`:

- validate `indexes.sequenceFlowById.get(flowId)`
- validate new ids are absent
- map `task|userTask|serviceTask` to XML/canonical types
- replace the old sequence flow tag with two new sequence flow tags plus the new task tag
- replace `<bpmn:outgoing>oldFlow</bpmn:outgoing>` inside the source element with the new incoming flow id
- replace `<bpmn:incoming>oldFlow</bpmn:incoming>` inside the target element with the new outgoing flow id
- return deterministic `InsertTaskBetweenResult`

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/insertTaskBetween.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/write/insertTaskBetween.ts test/write/insertTaskBetween.test.ts
git commit -m "feat: add insert task structural patcher"
git push origin main
```

## Task 2: CLI Command

**Files:**
- Create: `src/cli/commands/insertTaskBetweenCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add CLI tests for:

- dry-run envelope and unchanged input
- `--write -o` output contains new task and validates
- `-o` without `--write` exits `2`

- [ ] **Step 2: Run RED**

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL with `INVALID_COMMAND` for `insert-task-between`.

- [ ] **Step 3: Implement command**

Implement command using P2 write-command pattern:

- require file, `--flow`, `--id`, `--name`
- parse optional `--type`, `--incoming-flow-id`, `--outgoing-flow-id`
- reject `-o` without `--write`
- load BPMN and build indexes
- call `insertTaskBetweenXml`
- validate patched XML
- write only with `--write`
- return success envelope

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/insertTaskBetween.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/insertTaskBetweenCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add insert task cli command"
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
expect(cli).toContain('bpmn-agent-cli insert-task-between process.bpmn --flow Flow_A_B --id Task_New --name "Review"');
expect(contracts).toContain('InsertTaskBetweenResult');
```

- [ ] **Step 2: Run RED**

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL until docs are updated.

- [ ] **Step 3: Update docs and skill**

Document CLI usage, dry-run/write behavior, result contract, and `DI_NOT_UPDATED`.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/docs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p3a insert task command"
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
node dist/cli/main.js insert-task-between "$tmp_dir/process.bpmn" --flow Flow_Start_To_Task --id Task_Review --name Review --type userTask --pretty >/tmp/bpmn-insert-dry.json
node -e "const p=require('/tmp/bpmn-insert-dry.json'); if(!p.ok||p.command!=='insert-task-between'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js insert-task-between "$tmp_dir/process.bpmn" --flow Flow_Start_To_Task --id Task_Review --name Review --type userTask --write -o "$tmp_dir/inserted.bpmn" >/tmp/bpmn-insert-write.json
node -e "const p=require('/tmp/bpmn-insert-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/inserted.bpmn" >/tmp/bpmn-insert-validate.json
node -e "const p=require('/tmp/bpmn-insert-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
bundle_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$bundle_dir/bpmn-agent-cli.cjs"
node "$bundle_dir/bpmn-agent-cli.cjs" insert-task-between "$tmp_dir/process.bpmn" --flow Flow_Start_To_Task --id Task_Bundle --name Bundle --type task >/tmp/bpmn-insert-bundle.json
node -e "const p=require('/tmp/bpmn-insert-bundle.json'); if(!p.ok||p.command!=='insert-task-between'||!p.result.dryRun) process.exit(1)"
```

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p3a"
git push origin main
```

