import { describe, expect, it } from 'vitest';
import { BpmnCliError } from '../../src/bpmn/errors.js';
import { errorEnvelope, successEnvelope, toExitCode } from '../../src/output/jsonOutput.js';

describe('json output envelopes', () => {
  it('wraps query success results', () => {
    expect(successEnvelope({
      command: 'overview',
      file: 'process.bpmn',
      result: { counts: { sequenceFlows: 2 } }
    })).toEqual({
      ok: true,
      command: 'overview',
      file: 'process.bpmn',
      result: { counts: { sequenceFlows: 2 } }
    });
  });

  it('wraps domain errors with suggestions and exit codes', () => {
    const error = new BpmnCliError('ELEMENT_NOT_FOUND', 'Element not found', 1, { elementId: 'Task_X' }, [
      { id: 'Task_1', type: 'bpmn:Task', name: 'Do work', score: 0.7 }
    ]);

    expect(errorEnvelope(error)).toEqual({
      ok: false,
      error: {
        code: 'ELEMENT_NOT_FOUND',
        message: 'Element not found',
        details: { elementId: 'Task_X' },
        suggestions: [{ id: 'Task_1', type: 'bpmn:Task', name: 'Do work', score: 0.7 }]
      }
    });
    expect(toExitCode(error)).toBe(1);
  });
});
