import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getElement } from '../../src/query/element.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getElement', () => {
  it('returns task structure with incoming and outgoing flows', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getElement(buildIndexes(model), { id: 'Task_1' });

    expect(result.element).toMatchObject({
      id: 'Task_1',
      type: 'bpmn:Task',
      incoming: [expect.objectContaining({ id: 'Flow_Start_To_Task' })],
      outgoing: [expect.objectContaining({ id: 'Flow_Task_To_End' })]
    });
  });

  it('throws ELEMENT_NOT_FOUND with suggestions', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => getElement(buildIndexes(model), { id: 'Task_X' })).toThrow(BpmnCliError);
  });
});
