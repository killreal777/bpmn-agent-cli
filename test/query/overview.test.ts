import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getOverview } from '../../src/query/overview.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getOverview', () => {
  it('summarizes processes, counts, extensions, and warnings', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getOverview(model, buildIndexes(model));

    expect(result.definitions).toEqual({ id: 'Definitions_SimpleLinear' });
    expect(result.processes).toEqual([{ id: 'Process_SimpleLinear', name: 'Simple linear', flowNodes: 3, sequenceFlows: 2 }]);
    expect(result.counts.sequenceFlows).toBe(2);
    expect(result.counts.tasks).toEqual({ 'bpmn:Task': 1 });
    expect(result.diagnosticsSummary).toEqual({ errors: 0, warnings: 0, infos: 0 });
  });
});
