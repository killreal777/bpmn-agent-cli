import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getImpact } from '../../src/query/impact.js';

describe('getImpact', () => {
  it('returns an impact card for a call activity', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getImpact(buildIndexes(model), { id: 'CallActivity_RiskCheck', depth: 5, maxPaths: 20 });

    expect(result).toMatchObject({
      focus: { id: 'CallActivity_RiskCheck', type: 'bpmn:CallActivity' },
      participant: null,
      lanes: [],
      boundaryEvents: [],
      truncated: false,
      affected: {
        upstreamElementIds: ['StartEvent_Subprocess', 'SubProcess_PrepareApplication'],
        downstreamElementIds: ['EndEvent_Subprocess'],
        implementationElementIds: ['CallActivity_RiskCheck'],
        callActivityIds: ['CallActivity_RiskCheck']
      }
    });
    expect(result.upstream[0].nodes.map((node) => node.id)).toEqual([
      'StartEvent_Subprocess',
      'SubProcess_PrepareApplication',
      'CallActivity_RiskCheck'
    ]);
    expect(result.downstream[0].nodes.map((node) => node.id)).toEqual([
      'CallActivity_RiskCheck',
      'EndEvent_Subprocess'
    ]);
    expect(result.implementations).toEqual([
      expect.objectContaining({
        elementId: 'CallActivity_RiskCheck',
        kind: 'callActivity',
        value: 'Process_RiskCheck'
      })
    ]);
    expect(result.callActivities).toEqual([
      expect.objectContaining({
        element: expect.objectContaining({ id: 'CallActivity_RiskCheck' }),
        calledElement: 'Process_RiskCheck',
        variables: ['*', 'application.amount', 'customerId', 'requestedAmount', 'riskScore']
      })
    ]);
  });
});
