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
      children: [
        expect.objectContaining({ id: 'SubStart_1' }),
        expect.objectContaining({ id: 'SubTask_1' })
      ],
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
