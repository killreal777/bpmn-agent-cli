import { execFile } from 'node:child_process';
import { cp, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('extension bundle', () => {
  it('runs from a temp directory without node_modules', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bpmn-agent-cli-bundle-'));
    await cp('dist/extension/bpmn-agent-cli.cjs', join(dir, 'bpmn-agent-cli.cjs'));
    await cp('test/fixtures/simple-linear.bpmn', join(dir, 'simple-linear.bpmn'));

    const { stdout } = await execFileAsync('node', [join(dir, 'bpmn-agent-cli.cjs'), 'overview', join(dir, 'simple-linear.bpmn')], {
      cwd: dir
    });

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'overview',
      result: { definitions: { id: 'Definitions_SimpleLinear' } }
    });
  });
});
