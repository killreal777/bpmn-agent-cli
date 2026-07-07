import { BpmnCliError } from '../bpmn/errors.js';
import type { BpmnIndexes, Diagnostic, ElementSummary, SequenceFlowSummary } from '../bpmn/types.js';

export type GatewayResult = {
  id: string;
  type: string;
  name: string | null;
  incoming: SequenceFlowSummary[];
  branches: Array<{
    flowId: string;
    name: string | null;
    condition: string | null;
    target: ElementSummary;
  }>;
  behavior: 'exclusive' | 'inclusive' | 'parallel' | 'eventBased';
  diagnostics: Diagnostic[];
};

const GATEWAY_BEHAVIOR = new Map<string, GatewayResult['behavior']>([
  ['bpmn:ExclusiveGateway', 'exclusive'],
  ['bpmn:InclusiveGateway', 'inclusive'],
  ['bpmn:ParallelGateway', 'parallel'],
  ['bpmn:EventBasedGateway', 'eventBased']
]);

export function explainGateway(indexes: BpmnIndexes, args: { id: string }): GatewayResult {
  const gateway = indexes.byId.get(args.id);
  if (!gateway) {
    throw new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: args.id });
  }

  const behavior = GATEWAY_BEHAVIOR.get(gateway.type);
  if (!behavior) {
    throw new BpmnCliError('ELEMENT_IS_NOT_GATEWAY', 'Element is not a gateway', 1, { elementId: args.id, type: gateway.type });
  }

  const outgoing = indexes.outgoingByNodeId.get(gateway.id) ?? [];
  return {
    id: gateway.id,
    type: gateway.type,
    name: gateway.name,
    incoming: indexes.incomingByNodeId.get(gateway.id) ?? [],
    branches: outgoing.map((flow) => ({
      flowId: flow.id,
      name: flow.name,
      condition: flow.condition,
      target: indexes.byId.get(flow.targetId) ?? {
        id: flow.targetId,
        type: 'bpmn:Unknown',
        name: null,
        processId: gateway.processId
      }
    })),
    behavior,
    diagnostics: diagnosticsFor(behavior, outgoing)
  };
}

function diagnosticsFor(behavior: GatewayResult['behavior'], outgoing: SequenceFlowSummary[]): Diagnostic[] {
  if ((behavior === 'exclusive' || behavior === 'inclusive') && outgoing.some((flow) => !flow.condition)) {
    return [{
      severity: 'warning',
      code: 'GATEWAY_BRANCH_WITHOUT_CONDITION',
      message: 'Gateway has outgoing branch without condition'
    }];
  }

  return [];
}
