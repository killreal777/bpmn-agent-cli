import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { findPaths } from '../../src/query/path.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('findPaths', () => {
  it('finds a forward path between two elements', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'StartEvent_1',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 10,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths[0].nodes.map((node) => node.id)).toEqual(['StartEvent_1', 'Task_1', 'EndEvent_1']);
    expect(result.paths[0].depth).toBe(2);
  });

  it('finds a backward path while preserving endpoint order', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'EndEvent_1',
      to: 'StartEvent_1',
      direction: 'backward',
      depth: 10,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths[0].nodes.map((node) => node.id)).toEqual(['EndEvent_1', 'Task_1', 'StartEvent_1']);
  });

  it('returns no paths when target is unreachable within depth', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'StartEvent_1',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 1,
      maxPaths: 20
    });

    expect(result.found).toBe(false);
    expect(result.paths).toEqual([]);
    expect(result.truncated).toBe(true);
  });

  it('is cycle-safe', async () => {
    const model = await loadBpmn(fixturePath('cycle.bpmn'));
    const result = findPaths(buildIndexes(model), {
      from: 'Task_A',
      to: 'Task_A',
      direction: 'forward',
      depth: 5,
      maxPaths: 20
    });

    expect(result.found).toBe(true);
    expect(result.paths.some((path) => path.cycleDetected)).toBe(true);
  });

  it('rejects unknown endpoints', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => findPaths(buildIndexes(model), {
      from: 'Missing',
      to: 'EndEvent_1',
      direction: 'forward',
      depth: 10,
      maxPaths: 20
    })).toThrow(BpmnCliError);
  });
});
