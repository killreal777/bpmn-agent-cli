# P3-D Add Boundary Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `add-boundary-event`, a structural write command that attaches one timer boundary event to an existing activity.

**Architecture:** Put pure patching in `src/write/addBoundaryEvent.ts`, CLI orchestration in `src/cli/commands/addBoundaryEventCommand.ts`, and route from `src/cli/main.ts`. Follow dry-run/write safety and include `DI_NOT_UPDATED`.

**Tech Stack:** TypeScript, Node.js, Vitest, BPMN indexes, `bpmn-moddle` validation, existing CLI envelope utilities.

---

## Tasks

### Task 1: Pure Patcher

- Create `test/write/addBoundaryEvent.test.ts`.
- Run RED: `npm test -- test/write/addBoundaryEvent.test.ts`.
- Create `src/write/addBoundaryEvent.ts`.
- Run GREEN: `npm test -- test/write/addBoundaryEvent.test.ts`.
- Commit: `feat: add boundary event patcher`.

Required test behavior:

```ts
const plan = addBoundaryEventXml({
  xml: model.xml,
  indexes: buildIndexes(model),
  attachedToId: 'Task_1',
  boundaryEventId: 'Boundary_Timeout',
  targetId: 'EndEvent_1',
  flowId: 'Flow_Timeout_To_End',
  duration: 'PT10M',
  name: 'Timeout',
  file: model.filePath
});
expect(plan.xml).toContain('<bpmn:boundaryEvent id="Boundary_Timeout" name="Timeout" attachedToRef="Task_1">');
expect(plan.xml).toContain('<bpmn:timeDuration xsi:type="bpmn:tFormalExpression">PT10M</bpmn:timeDuration>');
expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Timeout_To_End" sourceRef="Boundary_Timeout" targetRef="EndEvent_1" />');
await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
```

### Task 2: CLI Command

- Add tests to `test/cli/cli.test.ts` for dry-run, write output, and `-o` without `--write`.
- Run RED: `npm test -- test/cli/cli.test.ts`.
- Create `src/cli/commands/addBoundaryEventCommand.ts`.
- Route in `src/cli/main.ts`.
- Run GREEN: `npm test -- test/write/addBoundaryEvent.test.ts test/cli/cli.test.ts`.
- Commit: `feat: add boundary event cli command`.

### Task 3: Docs

- Add docs expectations for `add-boundary-event` and `AddBoundaryEventResult`.
- Run RED: `npm test -- test/docs.test.ts`.
- Update README, CLI reference, output contracts, roadmap, backlog, and skill.
- Run GREEN: `npm test -- test/docs.test.ts`.
- Commit: `docs: document p3d boundary event command`.

### Task 4: Verification And Bundle

Run:

```bash
npm test
npm run typecheck
npm run build
npm run build:extension
```

Smoke:

```bash
tmp_dir="$(mktemp -d)"
cp test/fixtures/simple-linear.bpmn "$tmp_dir/process.bpmn"
node dist/cli/main.js add-boundary-event "$tmp_dir/process.bpmn" --attached-to Task_1 --id Boundary_Timeout --target EndEvent_1 --flow-id Flow_Timeout_To_End --duration PT10M --pretty >/tmp/bpmn-boundary-dry.json
node -e "const p=require('/tmp/bpmn-boundary-dry.json'); if(!p.ok||p.command!=='add-boundary-event'||!p.result.dryRun) process.exit(1)"
node dist/cli/main.js add-boundary-event "$tmp_dir/process.bpmn" --attached-to Task_1 --id Boundary_Timeout --target EndEvent_1 --flow-id Flow_Timeout_To_End --duration PT10M --write -o "$tmp_dir/boundary.bpmn" >/tmp/bpmn-boundary-write.json
node -e "const p=require('/tmp/bpmn-boundary-write.json'); if(!p.ok||!p.result.written) process.exit(1)"
node dist/cli/main.js validate "$tmp_dir/boundary.bpmn" >/tmp/bpmn-boundary-validate.json
node -e "const p=require('/tmp/bpmn-boundary-validate.json'); if(!p.ok||!p.result.valid) process.exit(1)"
```

Commit bundle:

```bash
git add dist/extension/bpmn-agent-cli.cjs
git commit -m "build: update extension bundle for p3d"
git push origin main
```

