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

  it('prints element envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'element', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'element',
      result: { element: { id: 'Task_1' } }
    });
  });

  it('prints gateway envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'gateway', 'test/fixtures/gateway-condition.bpmn', '--id', 'Gateway_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'gateway',
      result: { id: 'Gateway_1', behavior: 'exclusive' }
    });
  });

  it('prints trace envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'trace', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'trace',
      result: { from: { id: 'StartEvent_1' } }
    });
  });

  it('prints context envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'context', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'context',
      result: { focus: { id: 'Task_1' } }
    });
  });

  it('prints implementations envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementations', 'test/fixtures/camunda-implementations.bpmn']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'implementations',
      result: { serviceTasks: expect.any(Array) }
    });
  });

  it('prints participants envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'participants', 'test/fixtures/collaboration-message-flow.bpmn']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'participants',
      result: {
        collaborations: [
          expect.objectContaining({ id: 'Collaboration_1' })
        ]
      }
    });
  });

  it('exits 1 for validation errors', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'validate', 'test/fixtures/broken-reference.bpmn'])).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('"valid":false')
    });
  });

  it('prints raw legacy to-json output without envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'to-json', 'test/fixtures/simple-linear.bpmn']);
    const parsed = JSON.parse(stdout);

    expect(parsed.ok).toBeUndefined();
    expect(parsed.processes[0].id).toBe('Process_SimpleLinear');
  });

  it('prints raw converter config without envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'to-json', '--print-config', 'optimized']);
    const parsed = JSON.parse(stdout);

    expect(parsed.extends).toBeUndefined();
    expect(parsed.optimizations.enabled).toContain('compactElementMeta');
  });
});
