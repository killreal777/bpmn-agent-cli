import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { documentElementXml } from '../../src/write/documentElement.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('documentElementXml', () => {
  it('adds documentation to an element', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = documentElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      text: 'Reviews the application',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      before: { documentation: null },
      after: { documentation: 'Reviews the application' }
    });
    expect(plan.xml).toContain('<bpmn:documentation>Reviews the application</bpmn:documentation>');
  });

  it('replaces existing documentation', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const xml = model.xml.replace('<bpmn:task id="Task_1" name="Do work">', '<bpmn:task id="Task_1" name="Do work"><bpmn:documentation>Old docs</bpmn:documentation>');
    const plan = documentElementXml({
      xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      text: 'New docs',
      file: model.filePath
    });

    expect(plan.result.diff[0]).toMatchObject({ op: 'replace', before: 'Old docs', after: 'New docs' });
    expect(plan.xml).toContain('<bpmn:documentation>New docs</bpmn:documentation>');
    expect(plan.xml).not.toContain('Old docs');
  });

  it('escapes XML text values', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = documentElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      text: 'A & B < C > D',
      file: model.filePath
    });

    expect(plan.xml).toContain('A &amp; B &lt; C &gt; D');
  });

  it('rejects unknown ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => documentElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Missing',
      text: 'Nope',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
