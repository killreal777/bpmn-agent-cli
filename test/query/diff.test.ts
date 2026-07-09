import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { diffModels } from '../../src/query/diff.js';

describe('diffModels', () => {
  it('reports semantic BPMN changes by id', async () => {
    const base = await loadBpmn('test/fixtures/diff-base.bpmn');
    const candidate = await loadBpmn('test/fixtures/diff-candidate.bpmn');

    const result = diffModels({
      baseFile: base.filePath,
      candidateFile: candidate.filePath,
      base: buildIndexes(base),
      candidate: buildIndexes(candidate)
    });

    expect(result.changes.added).toEqual([expect.objectContaining({ id: 'Task_Added' })]);
    expect(result.changes.removed).toEqual([expect.objectContaining({ id: 'Task_Remove' })]);
    expect(result.changes.renamed).toEqual([
      {
        before: expect.objectContaining({ id: 'Task_Review', name: 'Review application' }),
        after: expect.objectContaining({ id: 'Task_Review', name: 'Review application updated' })
      }
    ]);
    expect(result.changes.reconnected).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'Flow_Start_To_Task',
        before: expect.objectContaining({ targetId: 'Task_Review' }),
        after: expect.objectContaining({ targetId: 'Service_Score' })
      })
    ]));
    expect(result.changes.implementationChanged).toEqual([
      {
        element: expect.objectContaining({ id: 'Service_Score' }),
        before: [expect.objectContaining({ value: '${oldDelegate}' })],
        after: [expect.objectContaining({ value: '${newDelegate}' })]
      }
    ]);
    expect(result.changes.documentationChanged).toEqual([
      {
        element: expect.objectContaining({ id: 'Task_Review' }),
        before: 'Old review documentation',
        after: 'New review documentation'
      }
    ]);
    expect(result.counts).toMatchObject({
      added: 1,
      removed: 1,
      renamed: 1,
      reconnected: 3,
      implementationChanged: 1,
      documentationChanged: 1
    });
  });
});
