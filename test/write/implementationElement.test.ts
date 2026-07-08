import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { fixturePath } from '../../src/testing/fixtures.js';
import { setImplementationXml } from '../../src/write/implementationElement.js';

describe('setImplementationXml', () => {
  it('replaces an existing delegate expression', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));
    const plan = setImplementationXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Service_Delegate',
      kind: 'delegateExpression',
      value: '${newDelegate}',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      dryRun: true,
      written: false,
      kind: 'delegateExpression',
      before: { 'camunda:delegateExpression': '${checkClientDelegate}' },
      after: { 'camunda:delegateExpression': '${newDelegate}' }
    });
    expect(plan.result.diff).toEqual([{
      op: 'replace',
      path: '/elements/Service_Delegate/camunda:delegateExpression',
      before: '${checkClientDelegate}',
      after: '${newDelegate}'
    }]);
    expect(plan.xml).toContain('camunda:delegateExpression="${newDelegate}"');
    expect(plan.xml).not.toContain('camunda:delegateExpression="${checkClientDelegate}"');
  });

  it('adds camunda namespace and form key when missing', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const plan = setImplementationXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Task_1',
      kind: 'form',
      value: 'review-form',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      kind: 'form',
      before: { 'camunda:formKey': null },
      after: { 'camunda:formKey': 'review-form' }
    });
    expect(plan.result.diff[0]).toMatchObject({
      op: 'add',
      path: '/elements/Task_1/camunda:formKey',
      before: null,
      after: 'review-form'
    });
    expect(plan.xml).toContain('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"');
    expect(plan.xml).toContain('camunda:formKey="review-form"');
  });

  it('sets external task type and topic together', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));
    const plan = setImplementationXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Service_External',
      kind: 'externalTask',
      value: 'score-v2',
      file: model.filePath
    });

    expect(plan.result).toMatchObject({
      kind: 'externalTask',
      before: {
        'camunda:type': 'external',
        'camunda:topic': 'score-client'
      },
      after: {
        'camunda:type': 'external',
        'camunda:topic': 'score-v2'
      }
    });
    expect(plan.result.diff).toHaveLength(2);
    expect(plan.xml).toContain('camunda:type="external"');
    expect(plan.xml).toContain('camunda:topic="score-v2"');
    expect(plan.xml).not.toContain('camunda:topic="score-client"');
  });

  it('rejects unknown ids', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));

    expect(() => setImplementationXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Missing',
      kind: 'delegateExpression',
      value: '${nope}',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });

  it('rejects unsupported kinds', async () => {
    const model = await loadBpmn(fixturePath('camunda-implementations.bpmn'));

    expect(() => setImplementationXml({
      xml: model.xml,
      indexes: buildIndexes(model),
      elementId: 'Service_Delegate',
      kind: 'listener',
      value: '${nope}',
      file: model.filePath
    })).toThrow(BpmnCliError);
  });
});
