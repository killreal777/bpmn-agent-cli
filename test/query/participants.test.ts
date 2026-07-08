import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getParticipants } from '../../src/query/participants.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getParticipants', () => {
  it('returns collaborations with participants and message flows', async () => {
    const model = await loadBpmn(fixturePath('collaboration-message-flow.bpmn'));
    const result = getParticipants(model, buildIndexes(model));

    expect(result.collaborations).toEqual([
      expect.objectContaining({
        id: 'Collaboration_1',
        participants: [
          { id: 'Participant_A', name: 'Sender', processId: 'Process_A' },
          { id: 'Participant_B', name: 'Receiver', processId: 'Process_B' }
        ],
        messageFlows: [
          expect.objectContaining({
            id: 'MessageFlow_1',
            name: 'Request',
            sourceId: 'Task_Send',
            targetId: 'Task_Receive'
          })
        ]
      })
    ]);
    expect(result.unreferencedProcesses).toEqual([]);
  });

  it('returns processes without collaboration participants', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getParticipants(model, buildIndexes(model));

    expect(result.collaborations).toEqual([]);
    expect(result.unreferencedProcesses).toEqual([
      { id: 'Process_SimpleLinear', name: 'Simple linear' }
    ]);
  });
});
