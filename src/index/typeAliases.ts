export const TYPE_ALIASES = new Map<string, string[]>([
  ['task', ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ScriptTask', 'bpmn:BusinessRuleTask', 'bpmn:SendTask', 'bpmn:ReceiveTask', 'bpmn:ManualTask']],
  ['userTask', ['bpmn:UserTask']],
  ['serviceTask', ['bpmn:ServiceTask']],
  ['gateway', ['bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:EventBasedGateway']],
  ['exclusiveGateway', ['bpmn:ExclusiveGateway']],
  ['event', ['bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:BoundaryEvent']],
  ['startEvent', ['bpmn:StartEvent']],
  ['endEvent', ['bpmn:EndEvent']],
  ['boundaryEvent', ['bpmn:BoundaryEvent']],
  ['sequenceFlow', ['bpmn:SequenceFlow']],
  ['subprocess', ['bpmn:SubProcess']],
  ['callActivity', ['bpmn:CallActivity']]
]);
