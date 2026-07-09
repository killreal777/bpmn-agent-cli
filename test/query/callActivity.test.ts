import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getCallActivities } from '../../src/query/callActivity.js';

describe('getCallActivities', () => {
  it('lists call activity contracts with mappings and variables', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getCallActivities(buildIndexes(model), {});

    expect(result.callActivities).toEqual([
      expect.objectContaining({
        element: expect.objectContaining({ id: 'CallActivity_RiskCheck', type: 'bpmn:CallActivity' }),
        calledElement: 'Process_RiskCheck',
        inputMappings: [
          expect.objectContaining({ direction: 'in', source: 'customerId', target: 'customerId' }),
          expect.objectContaining({ direction: 'in', sourceExpression: '${application.amount}', target: 'requestedAmount' })
        ],
        outputMappings: [
          expect.objectContaining({ direction: 'out', source: 'riskScore', target: 'riskScore' }),
          expect.objectContaining({ direction: 'out', variables: 'all', local: true })
        ],
        variables: ['*', 'application.amount', 'customerId', 'requestedAmount', 'riskScore'],
        passThrough: true,
        businessKey: null,
        warnings: []
      })
    ]);
    expect(result.variables).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '*', directions: ['pass-through'] }),
      expect.objectContaining({ name: 'customerId', directions: ['in'] }),
      expect.objectContaining({ name: 'riskScore', directions: ['out'] })
    ]));
  });

  it('filters to one call activity by id', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getCallActivities(buildIndexes(model), { id: 'CallActivity_RiskCheck' });

    expect(result.callActivities).toHaveLength(1);
    expect(result.callActivities[0]?.element.id).toBe('CallActivity_RiskCheck');
  });

  it('rejects existing non-call-activity elements', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');

    expect(() => getCallActivities(buildIndexes(model), { id: 'Task_NormalizeApplication' }))
      .toThrow(BpmnCliError);
  });
});
