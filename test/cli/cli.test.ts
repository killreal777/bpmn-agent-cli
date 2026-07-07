import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('CLI overview and validate', () => {
  it('prints overview envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'overview', 'test/fixtures/simple-linear.bpmn']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'overview',
      file: 'test/fixtures/simple-linear.bpmn',
      result: { definitions: { id: 'Definitions_SimpleLinear' } }
    });
  });

  it('prints validate envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'validate', 'test/fixtures/simple-linear.bpmn']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'validate',
      result: { valid: true, errors: [] }
    });
  });

  it('prints find envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'find', 'test/fixtures/simple-linear.bpmn', '--query', 'work']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'find',
      result: { matches: [expect.objectContaining({ id: 'Task_1', score: 0.8 })] }
    });
  });
});
