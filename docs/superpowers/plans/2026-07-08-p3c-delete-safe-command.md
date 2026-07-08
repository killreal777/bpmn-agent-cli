# P3-C Delete Safe Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `delete-safe`, a conservative structural command that removes one linear flow node and reconnects its predecessor to its successor.

**Architecture:** Put pure patching in `src/write/deleteSafe.ts`, CLI orchestration in `src/cli/commands/deleteSafeCommand.ts`, and route from `src/cli/main.ts`. Follow dry-run/write safety and include `DI_NOT_UPDATED`.

**Tech Stack:** TypeScript, Node.js, Vitest, BPMN indexes, `bpmn-moddle` validation, existing CLI envelope utilities.

---

## File Structure

- Create `src/write/deleteSafe.ts`: safety checks, XML edits, result schema.
- Create `test/write/deleteSafe.test.ts`: focused patcher tests.
- Create `src/cli/commands/deleteSafeCommand.ts`: CLI validation, load/index/patch/validate/write/envelope.
- Modify `src/cli/main.ts`: route `delete-safe`.
- Modify `test/cli/cli.test.ts`: dry-run/write/error smoke tests.
- Modify docs, roadmap, README, skill, docs test.
- Modify `dist/extension/bpmn-agent-cli.cjs`: regenerated bundle.

## Task 1: Pure Delete Patcher

**Files:**
- Create: `src/write/deleteSafe.ts`
- Test: `test/write/deleteSafe.test.ts`

- [ ] **Step 1: Write failing tests**

Test `deleteSafeXml` with `simple-linear.bpmn`:

```ts
const plan = deleteSafeXml({
  xml: model.xml,
  indexes: buildIndexes(model),
  elementId: 'Task_1',
  file: model.filePath
});
expect(plan.result.deleted).toMatchObject({ id: 'Task_1' });
expect(plan.result.removedFlows).toHaveLength(2);
expect(plan.result.replacementFlow).toMatchObject({
  sourceId: 'StartEvent_1',
  targetId: 'EndEvent_1'
});
expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
expect(plan.xml).not.toContain('<bpmn:task id="Task_1"');
expect(plan.xml).not.toContain('id="Flow_Start_To_Task"');
expect(plan.xml).not.toContain('id="Flow_Task_To_End"');
expect(plan.xml).toContain('sourceRef="StartEvent_1" targetRef="EndEvent_1"');
await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
```

Also test unsupported gateway deletion and duplicate replacement flow id.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/write/deleteSafe.test.ts
```

Expected: FAIL because `src/write/deleteSafe.ts` does not exist.

- [ ] **Step 3: Implement patcher**

Implement `deleteSafeXml(args)`:

- validate element exists
- reject unsafe element types
- get incoming/outgoing flows from indexes and require exactly one each
- validate replacement flow id uniqueness
- replace source outgoing old incoming flow id with replacement id
- replace target incoming old outgoing flow id with replacement id
- replace incoming sequence flow tag with replacement flow tag
- remove outgoing sequence flow tag
- remove deleted element XML section
- remove BPMNDI elements with `bpmnElement` equal to deleted element or removed flow ids
- return `DeleteSafeResult`

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/deleteSafe.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/write/deleteSafe.ts test/write/deleteSafe.test.ts
git commit -m "feat: add safe delete patcher"
git push origin main
```

## Task 2: CLI Command

**Files:**
- Create: `src/cli/commands/deleteSafeCommand.ts`
- Modify: `src/cli/main.ts`
- Test: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing CLI tests**

Add tests for dry-run, `--write -o`, and `-o` without `--write`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL with `INVALID_COMMAND` for `delete-safe`.

- [ ] **Step 3: Implement command**

Follow existing write-command pattern:

- require file and `--id`
- parse optional `--replacement-flow-id`
- reject `-o` without `--write`
- load BPMN, build indexes, patch, validate, optionally write
- return success envelope

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/write/deleteSafe.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/deleteSafeCommand.ts src/cli/main.ts test/cli/cli.test.ts
git commit -m "feat: add delete-safe cli command"
git push origin main
```

## Task 3: Docs And Skill

**Files:**
- Modify: `README.md`
- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/BACKLOG.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Add expectations for `bpmn-agent-cli delete-safe process.bpmn --id Task_1` and `DeleteSafeResult`.

- [ ] **Step 2: Run RED**

```bash
npm test -- test/docs.test.ts
```

- [ ] **Step 3: Update docs and skill**

Document usage, result contract, safety limits, and `DI_NOT_UPDATED`.

- [ ] **Step 4: Run GREEN**

```bash
npm test -- test/docs.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md docs/BACKLOG.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p3c delete-safe command"
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
node dist/cli/main.js delete-safe "$tmp_dir/process.bpmn" --id Task_1 --pretty >/tmp/bpmn-delete-dry.json
node -e "const p=require('/tmp/bpmn-delete-dry.json'); if(!p.ok||p.command!=='delete-safe'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js delete-safe "$tmp_dir/process.bpmn" --id Task_1 --write -o "$tmp_dir/deleted.bpmn" >/tmp/bpmn-delete-write.json
node -e "const p=require('/tmp/bpmn-delete-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/deleted.bpmn" >/tmp/bpmn-delete-validate.json
node -e "const p=require('/tmp/bpmn-delete-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
```

- [ ] **Step 3: Commit bundle**

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p3c"
git push origin main
```

