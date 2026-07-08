import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getVariables } from '../../src/query/variables.js';

describe('getVariables', () => {
  it('extracts CallActivity input and output mappings', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getVariables(buildIndexes(model), {});

    expect(result.variables).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '*', directions: ['pass-through'] }),
      expect.objectContaining({ name: 'application.amount', directions: ['in'] }),
      expect.objectContaining({ name: 'customerId', directions: ['in'] }),
      expect.objectContaining({ name: 'requestedAmount', directions: ['in'] }),
      expect.objectContaining({ name: 'riskScore', directions: ['out'] })
    ]));
    expect(result.callActivityMappings).toEqual([
      expect.objectContaining({
        element: expect.objectContaining({ id: 'CallActivity_RiskCheck' }),
        calledElement: 'Process_RiskCheck',
        inputMappings: expect.arrayContaining([
          expect.objectContaining({ direction: 'in', source: 'customerId', target: 'customerId' }),
          expect.objectContaining({ direction: 'in', sourceExpression: '${application.amount}', target: 'requestedAmount' })
        ]),
        outputMappings: expect.arrayContaining([
          expect.objectContaining({ direction: 'out', source: 'riskScore', target: 'riskScore' }),
          expect.objectContaining({ direction: 'out', variables: 'all', local: true })
        ])
      })
    ]);
    expect(result.usages).toContainEqual(expect.objectContaining({
      name: 'riskScore',
      direction: 'out',
      source: 'callActivityMapping',
      element: expect.objectContaining({ id: 'CallActivity_RiskCheck' })
    }));
  });

  it('extracts sequence flow condition variable reads', async () => {
    const model = await loadBpmn('benchmarks/fixtures/gateway-loan-process.bpmn');
    const result = getVariables(buildIndexes(model), {});

    expect(result.variables).toContainEqual(expect.objectContaining({ name: 'productType', directions: ['read'] }));
    expect(result.variables).toContainEqual(expect.objectContaining({ name: 'riskScore', directions: ['read'] }));
    expect(result.usages).toContainEqual(expect.objectContaining({
      name: 'productType',
      direction: 'read',
      source: 'sequenceFlowCondition',
      element: expect.objectContaining({ id: 'Flow_Product_WorkingCapital' }),
      expression: "${productType == 'WORKING_CAPITAL'}"
    }));
  });

  it('filters by element id', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getVariables(buildIndexes(model), { element: 'CallActivity_RiskCheck' });

    expect(result.usages.every((usage) => usage.element.id === 'CallActivity_RiskCheck')).toBe(true);
    expect(result.callActivityMappings).toHaveLength(1);
  });

  it('filters by variable name', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getVariables(buildIndexes(model), { name: 'riskScore' });

    expect(result.variables).toEqual([expect.objectContaining({ name: 'riskScore' })]);
    expect(result.usages.every((usage) => usage.name === 'riskScore')).toBe(true);
    expect(result.callActivityMappings).toEqual([
      expect.objectContaining({
        element: expect.objectContaining({ id: 'CallActivity_RiskCheck' }),
        outputMappings: [expect.objectContaining({ source: 'riskScore' })]
      })
    ]);
  });
});
