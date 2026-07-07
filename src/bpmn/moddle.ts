import { createRequire } from 'node:module';
import BpmnModdle from 'bpmn-moddle';

const require = createRequire(import.meta.url);
const camundaModdle = require('camunda-bpmn-moddle/resources/camunda.json') as Record<string, unknown>;

export function createBpmnModdle(): BpmnModdle {
  return new BpmnModdle({ camunda: camundaModdle });
}
