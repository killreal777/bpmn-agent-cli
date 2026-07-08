import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getEvents } from '../../src/query/events.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getEvents', () => {
  it('returns timer boundary event details', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = getEvents(model, buildIndexes(model), {});

    expect(result.events).toContainEqual(expect.objectContaining({
      id: 'Boundary_Timer',
      category: 'boundary',
      eventDefinitionType: 'bpmn:TimerEventDefinition',
      eventDefinitions: [
        expect.objectContaining({
          type: 'bpmn:TimerEventDefinition',
          value: 'PT10M'
        })
      ],
      attachedTo: expect.objectContaining({ id: 'Activity_Work' })
    }));
  });

  it('filters intermediate events without returning gateways', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = getEvents(model, buildIndexes(model), { type: 'intermediate' });

    expect(result.events.every((event) => event.category === 'intermediate')).toBe(true);
    expect(result.events.some((event) => event.type === 'bpmn:EventBasedGateway')).toBe(false);
  });

  it('rejects invalid event type filters', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));

    expect(() => getEvents(model, buildIndexes(model), { type: 'gateway' })).toThrow(BpmnCliError);
  });
});
