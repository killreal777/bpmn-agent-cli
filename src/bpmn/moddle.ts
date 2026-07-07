import BpmnModdle from 'bpmn-moddle';
import camundaModdle from 'camunda-bpmn-moddle/resources/camunda.json' with { type: 'json' };

export function createBpmnModdle(): BpmnModdle {
  return new BpmnModdle({ camunda: camundaModdle as Record<string, unknown> });
}
