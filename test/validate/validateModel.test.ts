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

  it('reports BPMN lint warnings without making the model invalid', async () => {
    const model = await loadBpmn(fixturePath('bpmn-lint.bpmn'));
    const result = validateModel(model, buildIndexes(model));

    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'SERVICE_TASK_MISSING_IMPLEMENTATION',
        elementId: 'Service_NoImpl'
      }),
      expect.objectContaining({
        code: 'EXTERNAL_TASK_MISSING_TOPIC',
        elementId: 'Service_ExternalNoTopic'
      }),
      expect.objectContaining({
        code: 'GATEWAY_OUTGOING_WITHOUT_CONDITION',
        elementId: 'Gateway_Check',
        details: expect.objectContaining({ flowId: 'Flow_Gateway_To_External' })
      }),
      expect.objectContaining({
        code: 'DEAD_END_FLOW_NODE',
        elementId: 'Task_DeadEnd'
      }),
      expect.objectContaining({
        code: 'UNREACHABLE_FLOW_NODE',
        elementId: 'Task_Unreachable'
      }),
      expect.objectContaining({
        code: 'DUPLICATE_NAME_IN_PROCESS',
        elementId: 'Task_Dupe_A',
        details: expect.objectContaining({ duplicateElementIds: ['Task_Dupe_A', 'Task_Dupe_B'] })
      }),
      expect.objectContaining({
        code: 'BOUNDARY_EVENT_WITHOUT_HANDLER',
        elementId: 'Boundary_NoHandler'
      }),
      expect.objectContaining({
        code: 'CALL_ACTIVITY_MISSING_CALLED_ELEMENT',
        elementId: 'Call_MissingCalledElement'
      })
    ]));
  });
});
