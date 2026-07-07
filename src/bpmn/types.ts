export type ModdleElement = {
  $type?: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
};

export type LoadedBpmnModel = {
  filePath: string;
  xml: string;
  definitions: ModdleElement;
  rootElements: ModdleElement[];
  processes: ModdleElement[];
  collaborations: ModdleElement[];
  warnings: Array<{ message: string }>;
};

export type ElementSummary = {
  id: string;
  type: string;
  name: string | null;
  processId?: string | null;
};

export type Diagnostic = {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  elementId?: string;
  details?: Record<string, unknown>;
};

export type SequenceFlowSummary = {
  id: string;
  type: 'bpmn:SequenceFlow';
  name: string | null;
  sourceId: string;
  sourceName: string | null;
  targetId: string;
  targetName: string | null;
  condition: string | null;
};

export type MessageFlowSummary = {
  id: string;
  type: 'bpmn:MessageFlow';
  name: string | null;
  sourceId: string | null;
  sourceName: string | null;
  targetId: string | null;
  targetName: string | null;
};

export type EventSummary = ElementSummary & {
  eventDefinitionType?: string | null;
};

export type ParticipantSummary = {
  id: string;
  name: string | null;
  processId: string | null;
};

export type LaneSummary = {
  id: string;
  name: string | null;
  flowNodeIds: string[];
};

export type ImplementationKind =
  | 'delegateExpression'
  | 'class'
  | 'expression'
  | 'externalTask'
  | 'callActivity'
  | 'listener'
  | 'form';

export type ImplementationSummary = {
  elementId: string;
  elementName: string | null;
  elementType: string;
  kind: ImplementationKind;
  value?: string;
  topic?: string;
  asyncBefore?: boolean;
  asyncAfter?: boolean;
  exclusive?: boolean;
  details?: Record<string, unknown>;
};

export type PathSummary = {
  nodes: ElementSummary[];
  flows: Array<{
    id: string;
    name: string | null;
    condition: string | null;
  }>;
  depth: number;
  cycleDetected?: boolean;
};

export type BpmnIndexes = {
  byId: Map<string, ElementSummary>;
  byNormalizedName: Map<string, ElementSummary[]>;
  byType: Map<string, ElementSummary[]>;
  byProcessId: Map<string, ElementSummary[]>;
  incomingByNodeId: Map<string, SequenceFlowSummary[]>;
  outgoingByNodeId: Map<string, SequenceFlowSummary[]>;
  sequenceFlowById: Map<string, SequenceFlowSummary>;
  messageFlowById: Map<string, MessageFlowSummary>;
  boundaryEventsByAttachedToId: Map<string, EventSummary[]>;
  childrenBySubprocessId: Map<string, ElementSummary[]>;
  participantByProcessId: Map<string, ParticipantSummary>;
  lanesByElementId: Map<string, LaneSummary[]>;
  implementationsByElementId: Map<string, ImplementationSummary[]>;
};
