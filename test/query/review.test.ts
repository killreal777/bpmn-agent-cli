import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildReviewPacket } from '../../src/query/review.js';

describe('buildReviewPacket', () => {
  it('builds a deterministic review packet with risk flags and checklist', async () => {
    const model = await loadBpmn('test/fixtures/bpmn-lint.bpmn');
    const result = buildReviewPacket(model);

    expect(result).toMatchObject({
      file: 'test/fixtures/bpmn-lint.bpmn',
      overview: {
        definitions: { id: 'Definitions_BpmnLint' }
      },
      diagnostics: {
        valid: true
      },
      participants: {
        collaborations: []
      },
      checklist: expect.arrayContaining([
        expect.objectContaining({ id: 'review-diagnostics' }),
        expect.objectContaining({ id: 'review-gateways' }),
        expect.objectContaining({ id: 'review-implementations' }),
        expect.objectContaining({ id: 'review-events' }),
        expect.objectContaining({ id: 'review-call-activities' })
      ])
    });
    expect(result.riskFlags).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SERVICE_TASK_MISSING_IMPLEMENTATION', elementId: 'Service_NoImpl' }),
      expect.objectContaining({ code: 'GATEWAY_OUTGOING_WITHOUT_CONDITION', elementId: 'Gateway_Check' }),
      expect.objectContaining({ code: 'CALL_ACTIVITY_MISSING_CALLED_ELEMENT', elementId: 'Call_MissingCalledElement' })
    ]));
    expect(result.events.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'Boundary_NoHandler', category: 'boundary' })
    ]));
  });
});
