# P1-A Reading Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add read-only `participants`, `lanes`, `events`, and `subprocess` CLI commands with deterministic JSON envelope output.

**Architecture:** Keep the existing layers: CLI dispatch in `src/cli`, BPMN loading in `src/bpmn`, deterministic indexes in `src/index`, pure query functions in `src/query`, and envelope handling in `src/output`. Extend indexes for all lanes and subprocess parent lookup, then implement one query/command pair at a time.

**Tech Stack:** TypeScript, Node.js, `bpmn-moddle`, `camunda-bpmn-moddle`, Vitest, tsx, esbuild extension bundle.

---

## Scope

Implement the design from `docs/superpowers/specs/2026-07-08-p1a-reading-commands-design.md`.

Do not implement:

- `path`
- markdown/text output
- write commands
- recursive subprocess tree export beyond direct children

## File Structure

Create:

- `test/fixtures/lanes.bpmn`: compact BPMN fixture with two lanes, one populated and one empty.
- `test/query/participants.test.ts`: pure participants query tests.
- `test/query/lanes.test.ts`: pure lanes query tests.
- `test/query/events.test.ts`: pure events query tests.
- `test/query/subprocess.test.ts`: pure subprocess query tests.
- `src/query/participants.ts`: participants result builder.
- `src/query/lanes.ts`: lanes result builder.
- `src/query/events.ts`: events result builder.
- `src/query/subprocess.ts`: subprocess result builder.
- `src/cli/commands/participantsCommand.ts`: command wrapper for participants.
- `src/cli/commands/lanesCommand.ts`: command wrapper for lanes.
- `src/cli/commands/eventsCommand.ts`: command wrapper for events.
- `src/cli/commands/subprocessCommand.ts`: command wrapper for subprocess.

Modify:

- `src/bpmn/types.ts`: add index fields, lane process id, and event definition summary types.
- `src/index/buildIndexes.ts`: populate required lane and subprocess parent indexes.
- `src/cli/main.ts`: route four new commands.
- `test/index/buildIndexes.test.ts`: cover required P1-A indexes.
- `test/cli/cli.test.ts`: cover CLI envelopes and command errors.
- `docs/CLI.md`: document commands and options.
- `docs/OUTPUT_CONTRACTS.md`: document result schemas.
- `docs/ROADMAP.md`: mark P1-A commands as implemented.
- `README.md`: add concise examples for new commands.
- `skills/bpmn-agent-cli/SKILL.md`: tell agents when to use new commands.

## Task 1: Required Indexes And Lane Fixture

**Files:**

- Create: `test/fixtures/lanes.bpmn`
- Modify: `test/fixtures/subprocess.bpmn`
- Modify: `test/index/buildIndexes.test.ts`
- Modify: `src/bpmn/types.ts`
- Modify: `src/index/buildIndexes.ts`

- [ ] **Step 1: Create lane fixture and expand subprocess fixture**

Create `test/fixtures/lanes.bpmn`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Lanes" targetNamespace="http://example.com/lanes">
  <bpmn:process id="Process_Lanes" name="Lane process">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Operations" name="Operations">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Review</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Empty" name="Empty lane" />
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_Start_To_Review</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Review" name="Review">
      <bpmn:incoming>Flow_Start_To_Review</bpmn:incoming>
      <bpmn:outgoing>Flow_Review_To_End</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Done">
      <bpmn:incoming>Flow_Review_To_End</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Start_To_Review" sourceRef="StartEvent_1" targetRef="Task_Review" />
    <bpmn:sequenceFlow id="Flow_Review_To_End" sourceRef="Task_Review" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>
```

Replace `test/fixtures/subprocess.bpmn` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  id="Definitions_SubProcess">
  <bpmn:process id="Process_SubProcess" name="Subprocess demo">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_Start_To_Sub</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:subProcess id="SubProcess_1" name="Handle request">
      <bpmn:incoming>Flow_Start_To_Sub</bpmn:incoming>
      <bpmn:outgoing>Flow_Sub_To_AdHoc</bpmn:outgoing>
      <bpmn:startEvent id="SubStart_1">
        <bpmn:outgoing>Flow_SubStart_To_Task</bpmn:outgoing>
      </bpmn:startEvent>
      <bpmn:sequenceFlow id="Flow_SubStart_To_Task" sourceRef="SubStart_1" targetRef="SubTask_1" />
      <bpmn:task id="SubTask_1" name="Inside subprocess">
        <bpmn:incoming>Flow_SubStart_To_Task</bpmn:incoming>
      </bpmn:task>
    </bpmn:subProcess>
    <bpmn:adHocSubProcess id="AdHocSubProcess_1" name="Ad hoc review">
      <bpmn:incoming>Flow_Sub_To_AdHoc</bpmn:incoming>
      <bpmn:outgoing>Flow_AdHoc_To_Transaction</bpmn:outgoing>
    </bpmn:adHocSubProcess>
    <bpmn:transaction id="Transaction_1" name="Transactional work">
      <bpmn:incoming>Flow_AdHoc_To_Transaction</bpmn:incoming>
      <bpmn:outgoing>Flow_Transaction_To_End</bpmn:outgoing>
    </bpmn:transaction>
    <bpmn:endEvent id="EndEvent_1" name="Done">
      <bpmn:incoming>Flow_Transaction_To_End</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Start_To_Sub" sourceRef="StartEvent_1" targetRef="SubProcess_1" />
    <bpmn:sequenceFlow id="Flow_Sub_To_AdHoc" sourceRef="SubProcess_1" targetRef="AdHocSubProcess_1" />
    <bpmn:sequenceFlow id="Flow_AdHoc_To_Transaction" sourceRef="AdHocSubProcess_1" targetRef="Transaction_1" />
    <bpmn:sequenceFlow id="Flow_Transaction_To_End" sourceRef="Transaction_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>
```

- [ ] **Step 2: Write failing index tests**

Append to `test/index/buildIndexes.test.ts`:

```ts
  it('indexes all lanes and subprocess parent relationships', async () => {
    const lanes = buildIndexes(await loadBpmn(fixturePath('lanes.bpmn')));
    const subprocess = buildIndexes(await loadBpmn(fixturePath('subprocess.bpmn')));

    expect(lanes.lanesById.get('Lane_Operations')).toMatchObject({
      id: 'Lane_Operations',
      name: 'Operations',
      processId: 'Process_Lanes',
      flowNodeIds: ['StartEvent_1', 'Task_Review']
    });
    expect(lanes.lanesById.get('Lane_Empty')).toMatchObject({
      id: 'Lane_Empty',
      name: 'Empty lane',
      processId: 'Process_Lanes',
      flowNodeIds: []
    });
    expect(lanes.lanesByProcessId.get('Process_Lanes')?.map((lane) => lane.id)).toEqual(['Lane_Empty', 'Lane_Operations']);
    expect(lanes.lanesByElementId.get('Task_Review')?.map((lane) => lane.id)).toEqual(['Lane_Operations']);
    expect(subprocess.subprocessParentByChildId.get('SubTask_1')).toBe('SubProcess_1');
    expect(subprocess.byType.get('bpmn:AdHocSubProcess')?.map((element) => element.id)).toEqual(['AdHocSubProcess_1']);
    expect(subprocess.byType.get('bpmn:Transaction')?.map((element) => element.id)).toEqual(['Transaction_1']);
  });
```

- [ ] **Step 3: Run index tests to verify failure**

Run:

```bash
npm test -- test/index/buildIndexes.test.ts
```

Expected: FAIL because `lanesById`, `lanesByProcessId`, and `subprocessParentByChildId` do not exist.

- [ ] **Step 4: Extend shared types**

Modify `src/bpmn/types.ts`:

```ts
export type LaneSummary = {
  id: string;
  name: string | null;
  processId: string | null;
  flowNodeIds: string[];
};
```

Add fields to `BpmnIndexes`:

```ts
  lanesById: Map<string, LaneSummary>;
  lanesByProcessId: Map<string, LaneSummary[]>;
  subprocessParentByChildId: Map<string, string>;
```

- [ ] **Step 5: Populate new indexes**

Modify `src/index/buildIndexes.ts`:

```ts
const SUBPROCESS_TYPES = new Set([
  'bpmn:SubProcess',
  'bpmn:AdHocSubProcess',
  'bpmn:Transaction'
]);
```

Ensure `FLOW_NODE_TYPES` includes all `SUBPROCESS_TYPES`, either by adding `bpmn:AdHocSubProcess` and `bpmn:Transaction` to the set or by constructing the set from task, event, gateway, and subprocess type groups.

Initialize indexes:

```ts
    lanesById: new Map(),
    lanesByProcessId: new Map(),
    subprocessParentByChildId: new Map(),
```

Pass process id into lane indexing:

```ts
indexLaneSet(indexes, laneSet, processId);
```

Track direct subprocess parent relationships inside `indexFlowElements`:

```ts
    if (subprocessId) {
      pushMap(indexes.childrenBySubprocessId, subprocessId, summary);
      indexes.subprocessParentByChildId.set(id, subprocessId);
    }
```

Use `SUBPROCESS_TYPES.has(type)` for recursive child indexing:

```ts
    if (SUBPROCESS_TYPES.has(type)) {
      indexFlowElements(indexes, elementsById, arrayOf<ModdleElement>(element.flowElements), processId, id);
    }
```

Update `indexLaneSet` signature and body:

```ts
function indexLaneSet(indexes: BpmnIndexes, laneSet: ModdleElement, processId: string): void {
  for (const lane of sortElements(arrayOf<ModdleElement>(laneSet.lanes))) {
    const summary: LaneSummary = {
      id: String(lane.id),
      name: stringValue(lane.name),
      processId,
      flowNodeIds: arrayOf<unknown>(lane.flowNodeRef).map(idOf).filter((id): id is string => Boolean(id)).sort()
    };

    indexes.lanesById.set(summary.id, summary);
    pushMap(indexes.lanesByProcessId, processId, summary);

    for (const flowNodeId of summary.flowNodeIds) {
      pushMap(indexes.lanesByElementId, flowNodeId, summary);
    }

    for (const childLaneSet of arrayOf<ModdleElement>(lane.childLaneSet ? [lane.childLaneSet] : [])) {
      indexLaneSet(indexes, childLaneSet, processId);
    }
  }
}
```

Add new maps to `sortIndexArrays`:

```ts
    indexes.lanesByProcessId,
```

- [ ] **Step 6: Run index tests to verify pass**

Run:

```bash
npm test -- test/index/buildIndexes.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit indexes**

```bash
git add src/bpmn/types.ts src/index/buildIndexes.ts test/index/buildIndexes.test.ts test/fixtures/lanes.bpmn test/fixtures/subprocess.bpmn
git commit -m "feat: add p1a structural indexes"
```

## Task 2: Participants Query And Command

**Files:**

- Create: `test/query/participants.test.ts`
- Create: `src/query/participants.ts`
- Create: `src/cli/commands/participantsCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing query tests**

Create `test/query/participants.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getParticipants } from '../../src/query/participants.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getParticipants', () => {
  it('returns collaborations with participants and message flows', async () => {
    const model = await loadBpmn(fixturePath('collaboration-message-flow.bpmn'));
    const result = getParticipants(model, buildIndexes(model));

    expect(result.collaborations).toEqual([
      expect.objectContaining({
        id: 'Collaboration_1',
        participants: [
          { id: 'Participant_A', name: 'Sender', processId: 'Process_A' },
          { id: 'Participant_B', name: 'Receiver', processId: 'Process_B' }
        ],
        messageFlows: [
          expect.objectContaining({
            id: 'MessageFlow_1',
            name: 'Request',
            sourceId: 'Task_Send',
            targetId: 'Task_Receive'
          })
        ]
      })
    ]);
    expect(result.unreferencedProcesses).toEqual([]);
  });

  it('returns processes without collaboration participants', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getParticipants(model, buildIndexes(model));

    expect(result.collaborations).toEqual([]);
    expect(result.unreferencedProcesses).toEqual([
      { id: 'Process_SimpleLinear', name: 'Simple linear' }
    ]);
  });
});
```

- [ ] **Step 2: Run query tests to verify failure**

Run:

```bash
npm test -- test/query/participants.test.ts
```

Expected: FAIL because `src/query/participants.ts` does not exist.

- [ ] **Step 3: Implement participants query**

Create `src/query/participants.ts`:

```ts
import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type { BpmnIndexes, LoadedBpmnModel, MessageFlowSummary, ModdleElement, ParticipantSummary } from '../bpmn/types.js';

export type ParticipantsResult = {
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: ParticipantSummary[];
    messageFlows: MessageFlowSummary[];
  }>;
  unreferencedProcesses: Array<{
    id: string;
    name: string | null;
  }>;
};

export function getParticipants(model: LoadedBpmnModel, indexes: BpmnIndexes): ParticipantsResult {
  const referencedProcessIds = new Set<string>();
  const collaborations = model.collaborations
    .map((collaboration) => {
      const participants = arrayOf<ModdleElement>(collaboration.participants)
        .map((participant) => ({
          id: String(participant.id),
          name: stringValue(participant.name),
          processId: idOf(participant.processRef)
        }))
        .sort(sortById);

      for (const participant of participants) {
        if (participant.processId) {
          referencedProcessIds.add(participant.processId);
        }
      }

      return {
        id: String(collaboration.id),
        name: stringValue(collaboration.name),
        participants,
        messageFlows: arrayOf<ModdleElement>(collaboration.messageFlows)
          .map((flow) => indexes.messageFlowById.get(String(flow.id)))
          .filter((flow): flow is MessageFlowSummary => Boolean(flow))
          .sort(sortById)
      };
    })
    .sort(sortById);

  return {
    collaborations,
    unreferencedProcesses: model.processes
      .map((process) => ({ id: String(process.id), name: stringValue(process.name) }))
      .filter((process) => !referencedProcessIds.has(process.id))
      .sort(sortById)
  };
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string') {
    return value.id;
  }
  return null;
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
```

- [ ] **Step 4: Run query tests to verify pass**

Run:

```bash
npm test -- test/query/participants.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing CLI test**

Append to `test/cli/cli.test.ts`:

```ts
  it('prints participants envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'participants', 'test/fixtures/collaboration-message-flow.bpmn']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'participants',
      result: {
        collaborations: [
          expect.objectContaining({ id: 'Collaboration_1' })
        ]
      }
    });
  });
```

- [ ] **Step 6: Run CLI test to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `participants` is an unknown command.

- [ ] **Step 7: Implement command wrapper and route**

Create `src/cli/commands/participantsCommand.ts`:

```ts
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getParticipants } from '../../query/participants.js';
import type { ParsedArgs } from '../args.js';

export async function participantsCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'participants requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'participants',
    file: args.file,
    result: getParticipants(model, buildIndexes(model))
  });
}
```

Modify `src/cli/main.ts`:

```ts
import { participantsCommand } from './commands/participantsCommand.js';
```

Add before `to-json`:

```ts
    if (parsed.command === 'participants') {
      writeJson(await participantsCommand(parsed), pretty);
      return;
    }
```

- [ ] **Step 8: Run participant checks**

Run:

```bash
npm test -- test/query/participants.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit participants command**

```bash
git add src/query/participants.ts src/cli/commands/participantsCommand.ts src/cli/main.ts test/query/participants.test.ts test/cli/cli.test.ts
git commit -m "feat: add participants query command"
```

## Task 3: Lanes Query And Command

**Files:**

- Create: `test/query/lanes.test.ts`
- Create: `src/query/lanes.ts`
- Create: `src/cli/commands/lanesCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing query tests**

Create `test/query/lanes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getLanes } from '../../src/query/lanes.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getLanes', () => {
  it('returns all lanes and no element mapping without --element', async () => {
    const model = await loadBpmn(fixturePath('lanes.bpmn'));
    const result = getLanes(buildIndexes(model), {});

    expect(result.lanes.map((lane) => lane.id)).toEqual(['Lane_Empty', 'Lane_Operations']);
    expect(result.lanes.find((lane) => lane.id === 'Lane_Empty')).toMatchObject({
      processId: 'Process_Lanes',
      flowNodes: []
    });
    expect(result.elementLanes).toEqual([]);
  });

  it('returns only lanes for a requested element', async () => {
    const model = await loadBpmn(fixturePath('lanes.bpmn'));
    const result = getLanes(buildIndexes(model), { elementId: 'Task_Review' });

    expect(result.lanes.map((lane) => lane.id)).toEqual(['Lane_Operations']);
    expect(result.lanes[0].flowNodes.map((node) => node.id)).toEqual(['StartEvent_1', 'Task_Review']);
    expect(result.elementLanes).toEqual([
      expect.objectContaining({
        element: expect.objectContaining({ id: 'Task_Review' }),
        lanes: [expect.objectContaining({ id: 'Lane_Operations' })]
      })
    ]);
  });

  it('rejects unknown element ids', async () => {
    const model = await loadBpmn(fixturePath('lanes.bpmn'));

    expect(() => getLanes(buildIndexes(model), { elementId: 'Missing' })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run query tests to verify failure**

Run:

```bash
npm test -- test/query/lanes.test.ts
```

Expected: FAIL because `src/query/lanes.ts` does not exist.

- [ ] **Step 3: Implement lanes query**

Create `src/query/lanes.ts`:

```ts
import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, LaneSummary } from '../bpmn/types.js';

export type LanesResult = {
  lanes: Array<{
    id: string;
    name: string | null;
    processId: string | null;
    flowNodes: ElementSummary[];
  }>;
  elementLanes: Array<{
    element: ElementSummary;
    lanes: LaneSummary[];
  }>;
};

export function getLanes(indexes: BpmnIndexes, args: { elementId?: string }): LanesResult {
  if (args.elementId) {
    const element = indexes.byId.get(args.elementId);
    if (!element) {
      throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.elementId });
    }

    const lanes = [...(indexes.lanesByElementId.get(args.elementId) ?? [])].sort(sortById);
    return {
      lanes: lanes.map((lane) => expandLane(indexes, lane)),
      elementLanes: [{ element, lanes }]
    };
  }

  return {
    lanes: [...indexes.lanesById.values()].sort(sortById).map((lane) => expandLane(indexes, lane)),
    elementLanes: []
  };
}

function expandLane(indexes: BpmnIndexes, lane: LaneSummary): LanesResult['lanes'][number] {
  return {
    id: lane.id,
    name: lane.name,
    processId: lane.processId,
    flowNodes: lane.flowNodeIds
      .map((id) => indexes.byId.get(id))
      .filter((element): element is ElementSummary => Boolean(element))
      .sort(sortById)
  };
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
```

- [ ] **Step 4: Run query tests to verify pass**

Run:

```bash
npm test -- test/query/lanes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing CLI tests**

Append to `test/cli/cli.test.ts`:

```ts
  it('prints lanes envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'lanes', 'test/fixtures/lanes.bpmn', '--element', 'Task_Review']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'lanes',
      result: {
        lanes: [expect.objectContaining({ id: 'Lane_Operations' })],
        elementLanes: [expect.objectContaining({ element: expect.objectContaining({ id: 'Task_Review' }) })]
      }
    });
  });
```

- [ ] **Step 6: Run CLI test to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `lanes` is an unknown command.

- [ ] **Step 7: Implement command wrapper and route**

Create `src/cli/commands/lanesCommand.ts`:

```ts
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getLanes } from '../../query/lanes.js';
import type { ParsedArgs } from '../args.js';

export async function lanesCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'lanes requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'lanes',
    file: args.file,
    result: getLanes(buildIndexes(model), {
      elementId: stringOption(args.options.get('--element'))
    })
  });
}

function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
```

Modify `src/cli/main.ts`:

```ts
import { lanesCommand } from './commands/lanesCommand.js';
```

Add before `to-json`:

```ts
    if (parsed.command === 'lanes') {
      writeJson(await lanesCommand(parsed), pretty);
      return;
    }
```

- [ ] **Step 8: Run lanes checks**

Run:

```bash
npm test -- test/query/lanes.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit lanes command**

```bash
git add src/query/lanes.ts src/cli/commands/lanesCommand.ts src/cli/main.ts test/query/lanes.test.ts test/cli/cli.test.ts
git commit -m "feat: add lanes query command"
```

## Task 4: Events Query And Command

**Files:**

- Create: `test/query/events.test.ts`
- Create: `src/query/events.ts`
- Create: `src/cli/commands/eventsCommand.ts`
- Modify: `src/bpmn/types.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing query tests**

Create `test/query/events.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getEvents } from '../../src/query/events.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getEvents', () => {
  it('returns timer boundary event details', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = getEvents(model, buildIndexes(model), {});

    expect(result.events).toContainEqual(expect.objectContaining({
      id: 'Boundary_Timer',
      category: 'boundary',
      eventDefinitionType: 'bpmn:TimerEventDefinition',
      eventDefinitions: [
        expect.objectContaining({
          type: 'bpmn:TimerEventDefinition',
          value: 'PT10M'
        })
      ],
      attachedTo: expect.objectContaining({ id: 'Activity_Work' })
    }));
  });

  it('filters intermediate events without returning gateways', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = getEvents(model, buildIndexes(model), { type: 'intermediate' });

    expect(result.events.every((event) => event.category === 'intermediate')).toBe(true);
    expect(result.events.some((event) => event.type === 'bpmn:EventBasedGateway')).toBe(false);
  });

  it('rejects invalid event type filters', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));

    expect(() => getEvents(model, buildIndexes(model), { type: 'gateway' })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run query tests to verify failure**

Run:

```bash
npm test -- test/query/events.test.ts
```

Expected: FAIL because `src/query/events.ts` does not exist.

- [ ] **Step 3: Add event definition type**

Modify `src/bpmn/types.ts`:

```ts
export type EventDefinitionSummary = {
  type: string;
  value?: string | null;
  refId?: string | null;
  refName?: string | null;
};
```

- [ ] **Step 4: Implement events query**

Create `src/query/events.ts` with these exported types and functions:

```ts
import { BpmnCliError } from '../bpmn/errors.js';
import { arrayOf, stringValue } from '../bpmn/normalize.js';
import type {
  BpmnIndexes,
  ElementSummary,
  EventDefinitionSummary,
  EventSummary,
  LoadedBpmnModel,
  ModdleElement,
  SequenceFlowSummary
} from '../bpmn/types.js';

type EventCategory = 'start' | 'end' | 'boundary' | 'intermediate' | 'other';

export type EventsResult = {
  events: Array<EventSummary & {
    category: EventCategory;
    eventDefinitions: EventDefinitionSummary[];
    attachedTo?: ElementSummary | null;
    outgoing: SequenceFlowSummary[];
    incoming: SequenceFlowSummary[];
  }>;
};

const EVENT_TYPES = new Set([
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:BoundaryEvent',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent'
]);

const VALID_FILTERS = new Set<EventCategory>(['start', 'end', 'boundary', 'intermediate', 'other']);

export function getEvents(model: LoadedBpmnModel, indexes: BpmnIndexes, args: { type?: string }): EventsResult {
  if (args.type && !VALID_FILTERS.has(args.type as EventCategory)) {
    throw new BpmnCliError('INVALID_OPTION_VALUE', 'Invalid events --type value', 2, {
      option: '--type',
      value: args.type
    });
  }

  const filter = args.type as EventCategory | undefined;
  const events = collectFlowElements(model.processes)
    .filter((element) => typeof element.id === 'string' && EVENT_TYPES.has(String(element.$type)))
    .map((element) => summarizeEvent(element, indexes))
    .filter((event) => !filter || event.category === filter)
    .sort(sortById);

  return { events };
}

function summarizeEvent(element: ModdleElement, indexes: BpmnIndexes): EventsResult['events'][number] {
  const id = String(element.id);
  const type = String(element.$type);
  const attachedToId = idOf(element.attachedToRef);
  return {
    id,
    type,
    name: stringValue(element.name),
    processId: indexes.byId.get(id)?.processId ?? null,
    eventDefinitionType: arrayOf<ModdleElement>(element.eventDefinitions)[0]?.$type ?? null,
    category: categoryFor(type),
    eventDefinitions: arrayOf<ModdleElement>(element.eventDefinitions).map(summarizeEventDefinition),
    attachedTo: attachedToId ? indexes.byId.get(attachedToId) ?? null : null,
    outgoing: indexes.outgoingByNodeId.get(id) ?? [],
    incoming: indexes.incomingByNodeId.get(id) ?? []
  };
}
```

Add helper functions in the same file:

```ts
function collectFlowElements(processes: ModdleElement[]): ModdleElement[] {
  const result: ModdleElement[] = [];
  for (const process of processes) {
    visitFlowElements(arrayOf<ModdleElement>(process.flowElements), result);
  }
  return result;
}

function visitFlowElements(elements: ModdleElement[], result: ModdleElement[]): void {
  for (const element of elements) {
    result.push(element);
    visitFlowElements(arrayOf<ModdleElement>(element.flowElements), result);
  }
}

function categoryFor(type: string): EventCategory {
  if (type === 'bpmn:StartEvent') return 'start';
  if (type === 'bpmn:EndEvent') return 'end';
  if (type === 'bpmn:BoundaryEvent') return 'boundary';
  if (type === 'bpmn:IntermediateCatchEvent' || type === 'bpmn:IntermediateThrowEvent') return 'intermediate';
  return 'other';
}

function summarizeEventDefinition(definition: ModdleElement): EventDefinitionSummary {
  const value = timerValue(definition);
  const ref = refValue(definition);
  return {
    type: String(definition.$type),
    ...(value ? { value } : {}),
    ...(ref.id ? { refId: ref.id } : {}),
    ...(ref.name ? { refName: ref.name } : {})
  };
}

function timerValue(definition: ModdleElement): string | null {
  for (const key of ['timeDuration', 'timeDate', 'timeCycle']) {
    const candidate = definition[key];
    if (isRecord(candidate)) {
      const value = stringValue(candidate.body);
      if (value) return value;
    }
  }
  return null;
}

function refValue(definition: ModdleElement): { id: string | null; name: string | null } {
  for (const key of ['messageRef', 'errorRef', 'signalRef', 'escalationRef']) {
    const candidate = definition[key];
    const id = idOf(candidate);
    if (id) {
      return { id, name: isRecord(candidate) ? stringValue(candidate.name) : null };
    }
  }
  return { id: null, name: null };
}

function idOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value;
  if (isRecord(value) && typeof value.id === 'string') return value.id;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
```

- [ ] **Step 5: Run query tests to verify pass**

Run:

```bash
npm test -- test/query/events.test.ts
```

Expected: PASS.

- [ ] **Step 6: Write failing CLI tests**

Append to `test/cli/cli.test.ts`:

```ts
  it('prints events envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'events', 'test/fixtures/boundary-timer.bpmn', '--type', 'boundary']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'events',
      result: {
        events: [
          expect.objectContaining({ id: 'Boundary_Timer', category: 'boundary' })
        ]
      }
    });
  });

  it('exits 2 for invalid events type filter', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'events', 'test/fixtures/boundary-timer.bpmn', '--type', 'gateway'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });
```

- [ ] **Step 7: Run CLI test to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `events` is an unknown command.

- [ ] **Step 8: Implement command wrapper and route**

Create `src/cli/commands/eventsCommand.ts`:

```ts
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getEvents } from '../../query/events.js';
import type { ParsedArgs } from '../args.js';

export async function eventsCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'events requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'events',
    file: args.file,
    result: getEvents(model, buildIndexes(model), {
      type: stringOption(args.options.get('--type'))
    })
  });
}

function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
```

Modify `src/cli/main.ts`:

```ts
import { eventsCommand } from './commands/eventsCommand.js';
```

Add before `to-json`:

```ts
    if (parsed.command === 'events') {
      writeJson(await eventsCommand(parsed), pretty);
      return;
    }
```

- [ ] **Step 9: Run events checks**

Run:

```bash
npm test -- test/query/events.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit events command**

```bash
git add src/bpmn/types.ts src/query/events.ts src/cli/commands/eventsCommand.ts src/cli/main.ts test/query/events.test.ts test/cli/cli.test.ts
git commit -m "feat: add events query command"
```

## Task 5: Subprocess Query And Command

**Files:**

- Create: `test/query/subprocess.test.ts`
- Create: `src/query/subprocess.ts`
- Create: `src/cli/commands/subprocessCommand.ts`
- Modify: `src/cli/main.ts`
- Modify: `test/cli/cli.test.ts`

- [ ] **Step 1: Write failing query tests**

Create `test/query/subprocess.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getSubprocesses } from '../../src/query/subprocess.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getSubprocesses', () => {
  it('returns subprocess direct children and flows', async () => {
    const model = await loadBpmn(fixturePath('subprocess.bpmn'));
    const result = getSubprocesses(buildIndexes(model), {});

    expect(result.subprocesses.map((subprocess) => subprocess.element.id)).toEqual([
      'AdHocSubProcess_1',
      'SubProcess_1',
      'Transaction_1'
    ]);
    expect(result.subprocesses.find((subprocess) => subprocess.element.id === 'SubProcess_1')).toMatchObject({
      element: expect.objectContaining({ id: 'SubProcess_1' }),
      parentSubprocessId: null,
      children: [expect.objectContaining({ id: 'SubTask_1' })],
      nestedSubprocesses: [],
      incoming: [expect.objectContaining({ id: 'Flow_Start_To_Sub' })],
      outgoing: [expect.objectContaining({ id: 'Flow_Sub_To_AdHoc' })]
    });
  });

  it('filters by subprocess id', async () => {
    const model = await loadBpmn(fixturePath('subprocess.bpmn'));
    const result = getSubprocesses(buildIndexes(model), { id: 'SubProcess_1' });

    expect(result.subprocesses).toHaveLength(1);
    expect(result.subprocesses[0].element.id).toBe('SubProcess_1');
  });

  it('rejects non-subprocess ids', async () => {
    const model = await loadBpmn(fixturePath('subprocess.bpmn'));

    expect(() => getSubprocesses(buildIndexes(model), { id: 'SubTask_1' })).toThrow(BpmnCliError);
  });
});
```

- [ ] **Step 2: Run query tests to verify failure**

Run:

```bash
npm test -- test/query/subprocess.test.ts
```

Expected: FAIL because `src/query/subprocess.ts` does not exist.

- [ ] **Step 3: Implement subprocess query**

Create `src/query/subprocess.ts`:

```ts
import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, ElementSummary, EventSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type SubprocessResult = {
  subprocesses: Array<{
    element: ElementSummary;
    parentSubprocessId: string | null;
    children: ElementSummary[];
    nestedSubprocesses: ElementSummary[];
    incoming: SequenceFlowSummary[];
    outgoing: SequenceFlowSummary[];
    boundaryEvents: EventSummary[];
  }>;
};

const SUBPROCESS_TYPES = new Set(['bpmn:SubProcess', 'bpmn:AdHocSubProcess', 'bpmn:Transaction']);

export function getSubprocesses(indexes: BpmnIndexes, args: { id?: string }): SubprocessResult {
  if (args.id) {
    const element = indexes.byId.get(args.id);
    if (!element) {
      throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
    }
    if (!SUBPROCESS_TYPES.has(element.type)) {
      throw new BpmnCliError('UNSUPPORTED_BPMN_ELEMENT_TYPE', 'Element is not a subprocess', 1, {
        elementId: args.id,
        type: element.type
      });
    }
    return { subprocesses: [summarizeSubprocess(indexes, element)] };
  }

  return {
    subprocesses: [...indexes.byId.values()]
      .filter((element) => SUBPROCESS_TYPES.has(element.type))
      .sort(sortById)
      .map((element) => summarizeSubprocess(indexes, element))
  };
}

function summarizeSubprocess(indexes: BpmnIndexes, element: ElementSummary): SubprocessResult['subprocesses'][number] {
  const children = [...(indexes.childrenBySubprocessId.get(element.id) ?? [])].sort(sortById);
  return {
    element,
    parentSubprocessId: indexes.subprocessParentByChildId.get(element.id) ?? null,
    children,
    nestedSubprocesses: children.filter((child) => SUBPROCESS_TYPES.has(child.type)).sort(sortById),
    incoming: indexes.incomingByNodeId.get(element.id) ?? [],
    outgoing: indexes.outgoingByNodeId.get(element.id) ?? [],
    boundaryEvents: indexes.boundaryEventsByAttachedToId.get(element.id) ?? []
  };
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id);
}
```

- [ ] **Step 4: Run query tests to verify pass**

Run:

```bash
npm test -- test/query/subprocess.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing CLI tests**

Append to `test/cli/cli.test.ts`:

```ts
  it('prints subprocess envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'subprocess', 'test/fixtures/subprocess.bpmn', '--id', 'SubProcess_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'subprocess',
      result: {
        subprocesses: [
          expect.objectContaining({ element: expect.objectContaining({ id: 'SubProcess_1' }) })
        ]
      }
    });
  });

  it('exits 1 when subprocess id is not subprocess-like', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'subprocess', 'test/fixtures/subprocess.bpmn', '--id', 'SubTask_1'])).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('UNSUPPORTED_BPMN_ELEMENT_TYPE')
    });
  });
```

- [ ] **Step 6: Run CLI test to verify failure**

Run:

```bash
npm test -- test/cli/cli.test.ts
```

Expected: FAIL because `subprocess` is an unknown command.

- [ ] **Step 7: Implement command wrapper and route**

Create `src/cli/commands/subprocessCommand.ts`:

```ts
import { BpmnCliError } from '../../bpmn/errors.js';
import { loadBpmn } from '../../bpmn/loadBpmn.js';
import { buildIndexes } from '../../index/buildIndexes.js';
import { successEnvelope } from '../../output/jsonOutput.js';
import { getSubprocesses } from '../../query/subprocess.js';
import type { ParsedArgs } from '../args.js';

export async function subprocessCommand(args: ParsedArgs): Promise<unknown> {
  if (!args.file) {
    throw new BpmnCliError('MISSING_FILE_ARGUMENT', 'subprocess requires a BPMN file', 2);
  }

  const model = await loadBpmn(args.file);
  return successEnvelope({
    command: 'subprocess',
    file: args.file,
    result: getSubprocesses(buildIndexes(model), {
      id: stringOption(args.options.get('--id'))
    })
  });
}

function stringOption(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
```

Modify `src/cli/main.ts`:

```ts
import { subprocessCommand } from './commands/subprocessCommand.js';
```

Add before `to-json`:

```ts
    if (parsed.command === 'subprocess') {
      writeJson(await subprocessCommand(parsed), pretty);
      return;
    }
```

- [ ] **Step 8: Run subprocess checks**

Run:

```bash
npm test -- test/query/subprocess.test.ts test/cli/cli.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit subprocess command**

```bash
git add src/query/subprocess.ts src/cli/commands/subprocessCommand.ts src/cli/main.ts test/query/subprocess.test.ts test/cli/cli.test.ts
git commit -m "feat: add subprocess query command"
```

## Task 6: Documentation, Skill, And Contracts

**Files:**

- Modify: `docs/CLI.md`
- Modify: `docs/OUTPUT_CONTRACTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `README.md`
- Modify: `skills/bpmn-agent-cli/SKILL.md`
- Modify: `test/docs.test.ts`

- [ ] **Step 1: Write failing docs test**

Modify `test/docs.test.ts` to assert the new commands are documented:

```ts
    expect(cli).toContain('bpmn-agent-cli participants process.bpmn');
    expect(cli).toContain('bpmn-agent-cli lanes process.bpmn --element Task_1');
    expect(cli).toContain('bpmn-agent-cli events process.bpmn --type boundary');
    expect(cli).toContain('bpmn-agent-cli subprocess process.bpmn --id SubProcess_1');
    expect(contracts).toContain('ParticipantsResult');
    expect(contracts).toContain('LanesResult');
    expect(contracts).toContain('EventsResult');
    expect(contracts).toContain('SubprocessResult');
    expect(roadmap).toContain('P1-A');
```

- [ ] **Step 2: Run docs test to verify failure**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: FAIL because docs do not contain P1-A command documentation.

- [ ] **Step 3: Update CLI docs**

Add sections to `docs/CLI.md`:

~~~md
## participants

```bash
bpmn-agent-cli participants process.bpmn
```

Returns collaborations, participants, message flows, and processes that are not referenced by a participant.

## lanes

```bash
bpmn-agent-cli lanes process.bpmn
bpmn-agent-cli lanes process.bpmn --element Task_1
```

Without `--element`, returns all lanes and an empty `elementLanes` array. With `--element`, returns only lanes containing that element and one element-to-lanes mapping.

## events

```bash
bpmn-agent-cli events process.bpmn
bpmn-agent-cli events process.bpmn --type boundary
```

`--type` accepts `start`, `end`, `boundary`, `intermediate`, and `other`. Event-based gateways are not returned by this command.

## subprocess

```bash
bpmn-agent-cli subprocess process.bpmn
bpmn-agent-cli subprocess process.bpmn --id SubProcess_1
```

Returns subprocess-like elements, direct children, direct nested subprocesses, incoming/outgoing flows, and boundary events.
~~~

- [ ] **Step 4: Update output contracts**

Add P1-A schemas to `docs/OUTPUT_CONTRACTS.md`:

~~~md
## ParticipantsResult

```ts
type ParticipantsResult = {
  collaborations: Array<{
    id: string;
    name: string | null;
    participants: ParticipantSummary[];
    messageFlows: MessageFlowSummary[];
  }>;
  unreferencedProcesses: Array<{ id: string; name: string | null }>;
};
```

## LanesResult

```ts
type LanesResult = {
  lanes: Array<{
    id: string;
    name: string | null;
    processId: string | null;
    flowNodes: ElementSummary[];
  }>;
  elementLanes: Array<{
    element: ElementSummary;
    lanes: LaneSummary[];
  }>;
};
```

## EventsResult

```ts
type EventDefinitionSummary = {
  type: string;
  value?: string | null;
  refId?: string | null;
  refName?: string | null;
};

type EventsResult = {
  events: Array<EventSummary & {
    category: "start" | "end" | "boundary" | "intermediate" | "other";
    eventDefinitions: EventDefinitionSummary[];
    attachedTo?: ElementSummary | null;
    outgoing: SequenceFlowSummary[];
    incoming: SequenceFlowSummary[];
  }>;
};
```

## SubprocessResult

```ts
type SubprocessResult = {
  subprocesses: Array<{
    element: ElementSummary;
    parentSubprocessId: string | null;
    children: ElementSummary[];
    nestedSubprocesses: ElementSummary[];
    incoming: SequenceFlowSummary[];
    outgoing: SequenceFlowSummary[];
    boundaryEvents: EventSummary[];
  }>;
};
```
~~~

- [ ] **Step 5: Update README, roadmap, and skill**

In `README.md`, add examples:

```bash
bpmn-agent-cli participants process.bpmn
bpmn-agent-cli lanes process.bpmn --element Activity_CheckClient
bpmn-agent-cli events process.bpmn --type boundary
bpmn-agent-cli subprocess process.bpmn --id SubProcess_1
```

In `docs/ROADMAP.md`, add `P1-A implemented` under P1 and keep remaining P1 items listed separately.

In `skills/bpmn-agent-cli/SKILL.md`, add workflow entries:

```md
10. Use `bpmn-agent-cli participants <file>` to inspect pools, participants, and message flows.
11. Use `bpmn-agent-cli lanes <file> --element <elementId>` to understand lane ownership for an element.
12. Use `bpmn-agent-cli events <file> --type boundary` to inspect event triggers and boundary handling.
13. Use `bpmn-agent-cli subprocess <file> --id <subprocessId>` to inspect direct subprocess contents.
```

- [ ] **Step 6: Run docs test to verify pass**

Run:

```bash
npm test -- test/docs.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit docs**

```bash
git add docs/CLI.md docs/OUTPUT_CONTRACTS.md docs/ROADMAP.md README.md skills/bpmn-agent-cli/SKILL.md test/docs.test.ts
git commit -m "docs: document p1a reading commands"
```

## Task 7: Final Verification And Bundle

**Files:**

- Modify only files required by verification failures.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: PASS with all test files passing.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit `0`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: exit `0`.

- [ ] **Step 4: Run extension build**

Run:

```bash
npm run build:extension
```

Expected: exit `0` and `dist/extension/bpmn-agent-cli.cjs` regenerated successfully.

- [ ] **Step 5: Run built CLI smoke commands**

Run:

```bash
node dist/cli/main.js participants test/fixtures/collaboration-message-flow.bpmn --pretty
node dist/cli/main.js lanes test/fixtures/lanes.bpmn --element Task_Review --pretty
node dist/cli/main.js events test/fixtures/boundary-timer.bpmn --type boundary --pretty
node dist/cli/main.js subprocess test/fixtures/subprocess.bpmn --id SubProcess_1 --pretty
```

Expected: all commands print JSON envelopes with `ok: true`.

- [ ] **Step 6: Run temp-dir bundle smoke commands**

Run:

```bash
tmp_dir="$(mktemp -d)"
cp dist/extension/bpmn-agent-cli.cjs "$tmp_dir/bpmn-agent-cli.cjs"
cp test/fixtures/collaboration-message-flow.bpmn "$tmp_dir/collaboration-message-flow.bpmn"
cp test/fixtures/lanes.bpmn "$tmp_dir/lanes.bpmn"
cp test/fixtures/boundary-timer.bpmn "$tmp_dir/boundary-timer.bpmn"
cp test/fixtures/subprocess.bpmn "$tmp_dir/subprocess.bpmn"
node "$tmp_dir/bpmn-agent-cli.cjs" participants "$tmp_dir/collaboration-message-flow.bpmn" --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" lanes "$tmp_dir/lanes.bpmn" --element Task_Review --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" events "$tmp_dir/boundary-timer.bpmn" --type boundary --pretty
node "$tmp_dir/bpmn-agent-cli.cjs" subprocess "$tmp_dir/subprocess.bpmn" --id SubProcess_1 --pretty
```

Expected: all commands print JSON envelopes with `ok: true`.

- [ ] **Step 7: Commit verification fixes**

If verification changed files, commit them:

```bash
git add src test docs README.md skills dist/extension/bpmn-agent-cli.cjs
git commit -m "fix: complete p1a verification"
```

If verification changed only generated files already included in earlier commits, include them in the relevant feature commit instead of creating an empty commit.
