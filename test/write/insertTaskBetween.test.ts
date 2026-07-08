import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../src/bpmn/moddle.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { insertTaskBetweenXml } from '../../src/write/insertTaskBetween.js';

describe('insertTaskBetweenXml', () => {
  it('splits a sequence flow and inserts a user task', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = insertTaskBetweenXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      flowId: 'Flow_Start_To_Task',
      elementId: 'Task_Review',
      name: 'Review',
      type: 'userTask',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      inserted: { id: 'Task_Review', type: 'bpmn:UserTask', name: 'Review' },
      replacedFlow: { id: 'Flow_Start_To_Task', sourceId: 'StartEvent_1', targetId: 'Task_1' }
    });
    expect(plan.result.newFlows).toEqual([
      expect.objectContaining({ id: 'Flow_Start_To_Task_to_Task_Review', sourceId: 'StartEvent_1', targetId: 'Task_Review' }),
      expect.objectContaining({ id: 'Task_Review_to_Task_1', sourceId: 'Task_Review', targetId: 'Task_1' })
    ]);
    expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
    expect(plan.xml).toContain('<bpmn:userTask id="Task_Review" name="Review">');
    expect(plan.xml).toContain('<bpmn:incoming>Flow_Start_To_Task_to_Task_Review</bpmn:incoming>');
    expect(plan.xml).toContain('<bpmn:outgoing>Task_Review_to_Task_1</bpmn:outgoing>');
    expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Start_To_Task_to_Task_Review" sourceRef="StartEvent_1" targetRef="Task_Review" />');
    expect(plan.xml).toContain('<bpmn:sequenceFlow id="Task_Review_to_Task_1" sourceRef="Task_Review" targetRef="Task_1" />');
    expect(plan.xml).not.toContain('<bpmn:sequenceFlow id="Flow_Start_To_Task" sourceRef="StartEvent_1" targetRef="Task_1" />');
    await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
  });

  it('rejects duplicate new ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => insertTaskBetweenXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      flowId: 'Flow_Start_To_Task',
      elementId: 'Task_1',
      name: 'Duplicate',
      type: 'task',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });

  it('rejects unsupported task types', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => insertTaskBetweenXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      flowId: 'Flow_Start_To_Task',
      elementId: 'Task_Review',
      name: 'Review',
      type: 'scriptTask',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
