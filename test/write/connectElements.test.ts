import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../src/bpmn/moddle.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { connectElementsXml } from '../../src/write/connectElements.js';

describe('connectElementsXml', () => {
  it('adds a sequence flow between existing flow nodes', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = connectElementsXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      sourceId: 'StartEvent_1',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Start_To_End',
      name: 'skip work',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      flow: {
        id: 'Flow_Start_To_End',
        sourceId: 'StartEvent_1',
        targetId: 'EndEvent_1',
        name: 'skip work'
      },
      source: { id: 'StartEvent_1' },
      target: { id: 'EndEvent_1' }
    });
    expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
    expect(plan.xml).toContain('<bpmn:outgoing>Flow_Start_To_End</bpmn:outgoing>');
    expect(plan.xml).toContain('<bpmn:incoming>Flow_Start_To_End</bpmn:incoming>');
    expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Start_To_End" name="skip work" sourceRef="StartEvent_1" targetRef="EndEvent_1" />');
    await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
  });

  it('rejects duplicate flow ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => connectElementsXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      sourceId: 'StartEvent_1',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Start_To_Task',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });

  it('rejects sequence-flow endpoints', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => connectElementsXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      sourceId: 'Flow_Start_To_Task',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Invalid',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
