import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { explainGateway } from '../../src/query/gateway.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('explainGateway', () => {
  it('returns outgoing branches with conditions', async () => {
    const model = await loadBpmn(fixturePath('gateway-condition.bpmn'));
    const result = explainGateway(buildIndexes(model), { id: 'Gateway_1' });

    expect(result).toMatchObject({
      id: 'Gateway_1',
      behavior: 'exclusive',
      branches: [
        expect.objectContaining({ flowId: 'Flow_Gateway_To_Approve', condition: 'riskScore < 50' }),
        expect.objectContaining({ flowId: 'Flow_Gateway_To_Reject', condition: 'riskScore >= 50' })
      ]
    });
  });

  it('rejects non-gateway ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => explainGateway(buildIndexes(model), { id: 'Task_1' })).toThrow(BpmnCliError);
  });
});
