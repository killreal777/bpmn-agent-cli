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

  it('reports variable-aware lint warnings without making the model invalid', async () => {
    const model = await loadBpmn(fixturePath('variable-lint.bpmn'));
    const result = validateModel(model, buildIndexes(model));

    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'CALL_ACTIVITY_WITHOUT_MAPPINGS',
        elementId: 'Call_NoMappings'
      }),
      expect.objectContaining({
        code: 'CALL_ACTIVITY_IN_MISSING_TARGET',
        elementId: 'Call_BadMappings',
        details: expect.objectContaining({ source: 'customerId' })
      }),
      expect.objectContaining({
        code: 'CALL_ACTIVITY_SOURCE_EXPRESSION_WITHOUT_TARGET',
        elementId: 'Call_BadMappings',
        details: expect.objectContaining({ sourceExpression: '${application.amount}' })
      }),
      expect.objectContaining({
        code: 'CALL_ACTIVITY_OUT_MISSING_TARGET',
        elementId: 'Call_BadMappings',
        details: expect.objectContaining({ source: 'riskScore' })
      }),
      expect.objectContaining({
        code: 'CALL_ACTIVITY_VARIABLES_ALL_PASS_THROUGH',
        elementId: 'Call_BadMappings'
      }),
      expect.objectContaining({
        code: 'CONDITION_VARIABLE_WITHOUT_PRODUCER',
        elementId: 'Flow_Gateway_To_End',
        details: expect.objectContaining({ variable: 'approvalFlag' })
      })
    ]));
  });
});
