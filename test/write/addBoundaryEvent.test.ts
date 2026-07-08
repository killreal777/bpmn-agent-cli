import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { createBpmnModdle } from '../../src/bpmn/moddle.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { addBoundaryEventXml } from '../../src/write/addBoundaryEvent.js';

describe('addBoundaryEventXml', () => {
  it('adds a timer boundary event to an activity', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = addBoundaryEventXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      attachedToId: 'Task_1',
      boundaryEventId: 'Boundary_Timeout',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Timeout_To_End',
      duration: 'PT10M',
      name: 'Timeout',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      boundaryEvent: { id: 'Boundary_Timeout', eventDefinitionType: 'bpmn:TimerEventDefinition' },
      attachedTo: { id: 'Task_1' },
      target: { id: 'EndEvent_1' },
      timer: { duration: 'PT10M', cancelActivity: true }
    });
    expect(plan.result.warnings).toContainEqual(expect.objectContaining({ code: 'DI_NOT_UPDATED' }));
    expect(plan.xml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
    expect(plan.xml).toContain('<bpmn:boundaryEvent id="Boundary_Timeout" name="Timeout" attachedToRef="Task_1">');
    expect(plan.xml).toContain('<bpmn:timeDuration xsi:type="bpmn:tFormalExpression">PT10M</bpmn:timeDuration>');
    expect(plan.xml).toContain('<bpmn:sequenceFlow id="Flow_Timeout_To_End" sourceRef="Boundary_Timeout" targetRef="EndEvent_1" />');
    expect(plan.xml).toContain('<bpmn:incoming>Flow_Timeout_To_End</bpmn:incoming>');
    await expect(createBpmnModdle().fromXML(plan.xml)).resolves.toBeTruthy();
  });

  it('rejects duplicate ids', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => addBoundaryEventXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      attachedToId: 'Task_1',
      boundaryEventId: 'EndEvent_1',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Timeout_To_End',
      duration: 'PT10M',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });

  it('rejects unsupported attached elements', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => addBoundaryEventXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      attachedToId: 'StartEvent_1',
      boundaryEventId: 'Boundary_Timeout',
      targetId: 'EndEvent_1',
      flowId: 'Flow_Timeout_To_End',
      duration: 'PT10M',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
