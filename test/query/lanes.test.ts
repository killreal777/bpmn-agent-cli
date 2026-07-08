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
