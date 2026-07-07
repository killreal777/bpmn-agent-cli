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
