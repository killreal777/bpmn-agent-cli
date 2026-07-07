import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getContext } from '../../src/query/context.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getContext', () => {
  it('returns before paths ending with focus and after paths starting with focus', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getContext(buildIndexes(model), { id: 'Task_1', before: 2, after: 2, maxPaths: 20 });

    expect(result.focus.id).toBe('Task_1');
    expect(result.before[0].nodes.at(-1)?.id).toBe('Task_1');
    expect(result.after[0].nodes[0].id).toBe('Task_1');
    expect(result.truncated).toBe(false);
  });
});
