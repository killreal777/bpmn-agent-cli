import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../src/bpmn/moddle.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { formatBpmnModel } from '../../src/write/formatBpmn.js';

describe('formatBpmnModel', () => {
  it('serializes formatted BPMN XML that still parses', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = await formatBpmnModel({ model, file: model.filePath });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      file: model.filePath,
      outputFile: null
    });
    expect(plan.result.before.bytes).toBe(Buffer.byteLength(model.xml, 'utf8'));
    expect(plan.result.after.bytes).toBeGreaterThan(0);
    expect(typeof plan.result.changed).toBe('boolean');
    expect(plan.xml).toContain('<bpmn:definitions');
    expect(plan.xml.endsWith('\n')).toBe(true);
    await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
  });

  it('reports write metadata when requested', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = await formatBpmnModel({
      model,
      file: model.filePath,
      outputFile: 'tmp/formatted.bpmn',
      dryRun: false,
      written: true
    });

    expect(plan.result).toMatchObject({
      dryRun: false,
      written: true,
      outputFile: 'tmp/formatted.bpmn'
    });
  });
});
