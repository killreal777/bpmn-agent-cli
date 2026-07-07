import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { validateModel } from '../../src/validate/validateModel.js';

describe('validateModel', () => {
  it('returns valid for a simple linear model', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = validateModel(model, buildIndexes(model));

    expect(result).toMatchObject({ valid: true, errors: [], infos: [] });
  });

  it('reports broken sequence-flow references as errors', async () => {
    const model = await loadBpmn(fixturePath('broken-reference.bpmn'));
    const result = validateModel(model, buildIndexes(model));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'BROKEN_SEQUENCE_FLOW_TARGET',
      elementId: 'Flow_To_Missing'
    }));
  });
});
