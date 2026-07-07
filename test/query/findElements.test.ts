import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { findElements } from '../../src/query/findElements.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('findElements', () => {
  it('prioritizes exact id and deterministic scores', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findElements(buildIndexes(model), { query: 'Task_1', limit: 10 });

    expect(result.matches[0]).toMatchObject({ id: 'Task_1', score: 1 });
    expect(result.truncated).toBe(false);
  });

  it('finds by normalized name substring', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findElements(buildIndexes(model), { query: 'work', limit: 10 });

    expect(result.matches).toContainEqual(expect.objectContaining({ id: 'Task_1', score: 0.8 }));
  });

  it('rejects unknown type filters', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => findElements(buildIndexes(model), { type: 'nonsense', limit: 10 })).toThrow(BpmnCliError);
  });
});
