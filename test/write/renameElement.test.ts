import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { renameElementXml } from '../../src/write/renameElement.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('renameElementXml', () => {
  it('replaces an existing name attribute', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = renameElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      name: 'Review application',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      before: { name: 'Do work' },
      after: { name: 'Review application' }
    });
    expect(plan.xml).toContain('id="Task_1" name="Review application"');
    expect(plan.xml).not.toContain('id="Task_1" name="Do work"');
  });

  it('adds a missing name attribute', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = renameElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'StartEvent_1',
      name: 'Start here',
      file: model.filePath
    });

    expect(plan.result.diff[0]).toMatchObject({ op: 'add', before: null, after: 'Start here' });
    expect(plan.xml).toContain('<bpmn:startEvent id="StartEvent_1" name="Start here">');
  });

  it('escapes XML attribute values', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = renameElementXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      name: 'A & "B" <C>',
      file: model.filePath
    });

    expect(plan.xml).toContain('name="A &amp; &quot;B&quot; &lt;C&gt;"');
  });

  it('rejects unknown ids', async () => {
    const xml = await readFile(fixturePath('simple-linear.bpmn'), 'utf8');
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => renameElementXml({
      xml,
      indexes: buildIndexes(model),
      elementId: 'Missing',
      name: 'Nope',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
