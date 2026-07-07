export type BpmnErrorCode =
  | 'INVALID_ARGUMENTS'
  | 'MISSING_FILE_ARGUMENT'
  | 'INVALID_COMMAND'
  | 'INVALID_OPTION_VALUE'
  | 'FILE_NOT_FOUND'
  | 'FILE_READ_ERROR'
  | 'BPMN_PARSE_ERROR'
  | 'ELEMENT_NOT_FOUND'
  | 'ELEMENT_IS_NOT_GATEWAY'
  | 'INVALID_TYPE_FILTER'
  | 'UNSUPPORTED_BPMN_ELEMENT_TYPE'
  | 'REFERENCE_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'OUTPUT_WRITE_ERROR'
  | 'INTERNAL_ERROR';

export class BpmnCliError extends Error {
  constructor(
    public readonly code: BpmnErrorCode,
    message: string,
    public readonly exitCode: number,
    public readonly details: Record<string, unknown> = {},
    public readonly suggestions: unknown[] = []
  ) {
    super(message);
  }
}
