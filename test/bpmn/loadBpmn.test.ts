import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('loadBpmn', () => {
  it('loads BPMN definitions with Camunda extension support', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));

    expect(model.filePath.endsWith('simple-linear.bpmn')).toBe(true);
    expect(model.definitions.id).toBe('Definitions_SimpleLinear');
    expect(model.processes.map((process) => process.id)).toEqual(['Process_SimpleLinear']);
    expect(model.warnings).toEqual([]);
  });

  it('maps unreadable files to FILE_NOT_FOUND domain errors', async () => {
    await expect(loadBpmn('test/fixtures/missing.bpmn')).rejects.toMatchObject({
      code: 'FILE_NOT_FOUND',
      exitCode: 3
    });
  });

  it('maps invalid XML to BPMN_PARSE_ERROR domain errors', async () => {
    await expect(loadBpmn(fixturePath('invalid-xml.bpmn'))).rejects.toMatchObject({
      code: 'BPMN_PARSE_ERROR',
      exitCode: 4
    });
  });
});
