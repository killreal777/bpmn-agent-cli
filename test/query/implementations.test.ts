import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { listImplementations } from '../../src/query/implementations.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('listImplementations', () => {
  it('groups service tasks, call activities, listeners, and forms', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));
    const result = listImplementations(buildIndexes(model), {});

    expect(result.serviceTasks).toContainEqual(expect.objectContaining({ elementId: 'Service_Delegate', kind: 'delegateExpression' }));
    expect(result.serviceTasks).toContainEqual(expect.objectContaining({ elementId: 'Service_External', kind: 'externalTask', topic: 'score-client' }));
    expect(result.forms).toContainEqual(expect.objectContaining({ elementId: 'User_Approve', kind: 'form', value: 'approve-form' }));
    expect(result.callActivities).toContainEqual(expect.objectContaining({ elementId: 'Call_SubProcess', kind: 'callActivity', value: 'risk-check' }));
  });
});
