import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../src/bpmn/moddle.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { deleteSafeXml } from '../../src/write/deleteSafe.js';

describe('deleteSafeXml', () => {
  it('deletes a linear task and reconnects source to target', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = deleteSafeXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      deleted: { id: 'Task_1' },
      replacementFlow: {
        sourceId: 'StartEvent_1',
        targetId: 'EndEvent_1'
      }
    });
    expect(plan.result.removedFlows).toEqual([
      expect.objectContaining({ id: 'Flow_Start_To_Task' }),
      expect.objectContaining({ id: 'Flow_Task_To_End' })
    ]);
    expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
    expect(plan.xml).not.toContain('<bpmn:task id="Task_1"');
    expect(plan.xml).not.toContain('id="Flow_Start_To_Task"');
    expect(plan.xml).not.toContain('id="Flow_Task_To_End"');
    expect(plan.xml).toContain('sourceRef="StartEvent_1" targetRef="EndEvent_1"');
    expect(plan.xml).toContain('<bpmn:outgoing>Flow_Start_To_Task_to_EndEvent_1</bpmn:outgoing>');
    expect(plan.xml).toContain('<bpmn:incoming>Flow_Start_To_Task_to_EndEvent_1</bpmn:incoming>');
    await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
  });

  it('rejects unsafe gateway deletion', async () => {
    const model = await loadBpmn(fixturePath('gateway-condition.bpmn'));

    expect(() => deleteSafeXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Gateway_1',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });

  it('rejects duplicate replacement flow ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => deleteSafeXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      replacementFlowId: 'Flow_Start_To_Task',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
