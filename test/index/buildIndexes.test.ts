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
});
