import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildExportModel } from '../../src/query/exportModel.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('buildExportModel', () => {
  it('builds selected overview section only', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = buildExportModel(model, ['overview']);

    expect(result.sections).toEqual(['overview']);
    expect(result.overview?.definitions.id).toBe('Definitions_SimpleLinear');
    expect(result.events).toBeUndefined();
  });

  it('builds all sections in deterministic order', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const result = buildExportModel(model, ['overview', 'participants', 'lanes', 'events', 'subprocess', 'implementations']);

    expect(result.sections).toEqual(['overview', 'participants', 'lanes', 'events', 'subprocess', 'implementations']);
    expect(result.events?.events.some((event) => event.id === 'Boundary_Timer')).toBe(true);
  });
});
