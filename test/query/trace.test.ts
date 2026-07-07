import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { trace } from '../../src/query/trace.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('trace', () => {
  it('traces forward paths with edge depth', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = trace(buildIndexes(model), { from: 'StartEvent_1', direction: 'forward', depth: 5, maxPaths: 20 });

    expect(result.paths[0]).toMatchObject({
      nodes: [
        expect.objectContaining({ id: 'StartEvent_1' }),
        expect.objectContaining({ id: 'Task_1' }),
        expect.objectContaining({ id: 'EndEvent_1' })
      ],
      depth: 2
    });
    expect(result.paths[0].flows).toHaveLength(2);
  });

  it('stops traversal after showing a repeated cycle node once', async () => {
    const model = await loadBpmn(fixturePath('cycle.bpmn'));
    const result = trace(buildIndexes(model), { from: 'Task_A', direction: 'forward', depth: 10, maxPaths: 20 });

    expect(result.paths.some((path) => path.cycleDetected)).toBe(true);
  });
});
