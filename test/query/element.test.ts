import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { buildIndexes } from '../../src/index/buildIndexes.js';
import { getElement } from '../../src/query/element.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('getElement', () => {
  it('returns task structure with incoming and outgoing flows', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const result = getElement(buildIndexes(model), { id: 'Task_1' });

    expect(result.element).toMatchObject({
      id: 'Task_1',
      type: 'bpmn:Task',
      incoming: [expect.objectContaining({ id: 'Flow_Start_To_Task' })],
      outgoing: [expect.objectContaining({ id: 'Flow_Task_To_End' })]
    });
  });

  it('throws ELEMENT_NOT_FOUND with suggestions', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(() => getElement(buildIndexes(model), { id: 'Task_X' })).toThrow(BpmnCliError);
  });

  it('returns call activity details with Camunda input and output mappings', async () => {
    const model = await loadBpmn('benchmarks/fixtures/subprocess-call-activity.bpmn');
    const result = getElement(buildIndexes(model), { id: 'CallActivity_RiskCheck' });

    expect(result.element.details).toMatchObject({
      kind: 'callActivity',
      calledElement: 'Process_RiskCheck',
      inputMappings: [
        { direction: 'in', source: 'customerId', target: 'customerId' },
        { direction: 'in', sourceExpression: '${application.amount}', target: 'requestedAmount' }
      ],
      outputMappings: [
        { direction: 'out', source: 'riskScore', target: 'riskScore' },
        { direction: 'out', variables: 'all', local: true }
      ],
      variableCandidates: ['application.amount', 'customerId', 'requestedAmount', 'riskScore']
    });
  });

  it('returns service task implementation details', async () => {
    const model = await loadBpmn('benchmarks/fixtures/gateway-loan-process.bpmn');
    const result = getElement(buildIndexes(model), { id: 'Task_ApproveLoan' });

    expect(result.element.details).toMatchObject({
      kind: 'serviceTask',
      implementation: {
        type: 'external',
        topic: 'loan-approval',
        delegateExpression: null,
        class: null,
        expression: null
      }
    });
  });

  it('returns user task form details', async () => {
    const model = await loadBpmn('benchmarks/fixtures/gateway-loan-process.bpmn');
    const result = getElement(buildIndexes(model), { id: 'Task_ManualReview' });

    expect(result.element.details).toMatchObject({
      kind: 'userTask',
      formKey: 'loan-review'
    });
  });

  it('returns sequence flow condition details and variable candidates', async () => {
    const model = await loadBpmn('benchmarks/fixtures/gateway-loan-process.bpmn');
    const result = getElement(buildIndexes(model), { id: 'Flow_Product_WorkingCapital' });

    expect(result.element.details).toMatchObject({
      kind: 'sequenceFlow',
      condition: "${productType == 'WORKING_CAPITAL'}",
      variableCandidates: ['productType']
    });
  });

  it('returns boundary event details', async () => {
    const model = await loadBpmn('benchmarks/fixtures/boundary-events.bpmn');
    const result = getElement(buildIndexes(model), { id: 'Boundary_Timer' });

    expect(result.element.details).toMatchObject({
      kind: 'boundaryEvent',
      attachedTo: { id: 'Task_WaitForDocuments' },
      cancelActivity: false,
      eventDefinitions: [
        {
          type: 'bpmn:TimerEventDefinition',
          value: 'PT2D'
        }
      ]
    });
  });
});
