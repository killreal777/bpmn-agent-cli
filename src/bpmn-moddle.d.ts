declare module 'bpmn-moddle' {
  export type BpmnModdleWarning = {
    message?: string;
  };

  export type FromXmlResult = {
    rootElement: unknown;
    references: unknown[];
    warnings: BpmnModdleWarning[];
    elementsById: Record<string, unknown>;
  };

  export type ToXmlResult = {
    xml: string;
  };

  export default class BpmnModdle {
    constructor(packages?: Record<string, unknown>);
    fromXML(xml: string): Promise<FromXmlResult>;
    toXML(element: unknown, options?: { format?: boolean; preamble?: boolean }): Promise<ToXmlResult>;
  }
}
