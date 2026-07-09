import { execFile } from 'node:child_process';
import { copyFile, readFile, rm } from 'node:fs/promises';
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

  it('writes trace metrics without polluting JSON stdout', async () => {
    const metricsPath = 'tmp/cli-trace-metrics.jsonl';
    await rm(metricsPath, { force: true });

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'overview', 'test/fixtures/simple-linear.bpmn', '--trace-metrics', metricsPath]);
    const parsed = JSON.parse(stdout);
    const metrics = (await readFile(metricsPath, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));

    expect(parsed).toMatchObject({ ok: true, command: 'overview' });
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      command: 'overview',
      fileHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      argsHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      exitCode: 0,
      errorCode: null
    });
    expect(metrics[0].stdoutBytes).toBe(Buffer.byteLength(stdout, 'utf8'));
    expect(JSON.stringify(metrics[0])).not.toContain('Definitions_SimpleLinear');
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

  it('prints variables envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'variables', 'benchmarks/fixtures/subprocess-call-activity.bpmn', '--element', 'CallActivity_RiskCheck', '--name', 'riskScore']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'variables',
      result: {
        variables: [expect.objectContaining({ name: 'riskScore' })],
        usages: [expect.objectContaining({ name: 'riskScore', direction: 'out' })],
        callActivityMappings: [expect.objectContaining({ element: expect.objectContaining({ id: 'CallActivity_RiskCheck' }) })]
      }
    });
  });

  it('prints call-activity envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'call-activity', 'benchmarks/fixtures/subprocess-call-activity.bpmn', '--id', 'CallActivity_RiskCheck']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'call-activity',
      result: {
        callActivities: [
          expect.objectContaining({
            element: expect.objectContaining({ id: 'CallActivity_RiskCheck' }),
            calledElement: 'Process_RiskCheck',
            passThrough: true,
            variables: expect.arrayContaining(['customerId', 'riskScore'])
          })
        ],
        variables: expect.arrayContaining([expect.objectContaining({ name: 'riskScore' })])
      }
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

  it('prints lanes envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'lanes', 'test/fixtures/lanes.bpmn', '--element', 'Task_Review']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'lanes',
      result: {
        lanes: [expect.objectContaining({ id: 'Lane_Operations' })],
        elementLanes: [expect.objectContaining({ element: expect.objectContaining({ id: 'Task_Review' }) })]
      }
    });
  });

  it('prints events envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'events', 'test/fixtures/boundary-timer.bpmn', '--type', 'boundary']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'events',
      result: {
        events: [
          expect.objectContaining({ id: 'Boundary_Timer', category: 'boundary' })
        ]
      }
    });
  });

  it('prints subprocess envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'subprocess', 'test/fixtures/subprocess.bpmn', '--id', 'SubProcess_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'subprocess',
      result: {
        subprocesses: [
          expect.objectContaining({ element: expect.objectContaining({ id: 'SubProcess_1' }) })
        ]
      }
    });
  });

  it('prints path envelope as JSON', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'path', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1', '--to', 'EndEvent_1']);

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'path',
      result: {
        found: true,
        paths: [expect.objectContaining({ depth: 2 })]
      }
    });
  });

  it('prints markdown export without envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'markdown', '--section', 'overview']);

    expect(stdout).toContain('# BPMN Export');
    expect(stdout).toContain('Definitions_SimpleLinear');
    expect(JSON.parse.bind(JSON, stdout)).toThrow();
  });

  it('prints json export envelope', async () => {
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'json', '--section', 'overview']);
    const parsed = JSON.parse(stdout);

    expect(parsed).toMatchObject({
      ok: true,
      command: 'export',
      result: { format: 'json', sections: ['overview'] }
    });
  });

  it('writes export output to explicit path', async () => {
    const output = 'tmp/export-test.md';
    await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'export', 'test/fixtures/simple-linear.bpmn', '--format', 'markdown', '--section', 'overview', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(written).toContain('# BPMN Export');
  });

  it('prints rename dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'rename', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1', '--name', 'Review']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'rename',
      result: {
        dryRun: true,
        written: false,
        before: { name: 'Do work' },
        after: { name: 'Review' }
      }
    });
    expect(after).toBe(before);
  });

  it('writes rename output to explicit path', async () => {
    const input = 'tmp/rename-input.bpmn';
    const output = 'tmp/rename-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'rename', input, '--id', 'Task_1', '--name', 'Review', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'rename',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('id="Task_1" name="Review"');
  });

  it('prints documentation dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'documentation', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1', '--text', 'Documents task']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'documentation',
      result: {
        dryRun: true,
        written: false,
        after: { documentation: 'Documents task' }
      }
    });
    expect(after).toBe(before);
  });

  it('writes documentation output to explicit path', async () => {
    const input = 'tmp/documentation-input.bpmn';
    const output = 'tmp/documentation-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'documentation', input, '--id', 'Task_1', '--text', 'Documents task', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'documentation',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('<bpmn:documentation>Documents task</bpmn:documentation>');
  });

  it('prints implementation dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/camunda-implementations.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementation', 'test/fixtures/camunda-implementations.bpmn', '--id', 'Service_Delegate', '--kind', 'delegateExpression', '--value', '${newDelegate}']);
    const after = await readFile('test/fixtures/camunda-implementations.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'implementation',
      result: {
        dryRun: true,
        written: false,
        kind: 'delegateExpression',
        before: { 'camunda:delegateExpression': '${checkClientDelegate}' },
        after: { 'camunda:delegateExpression': '${newDelegate}' }
      }
    });
    expect(after).toBe(before);
  });

  it('writes implementation output to explicit path', async () => {
    const input = 'tmp/implementation-input.bpmn';
    const output = 'tmp/implementation-output.bpmn';
    await copyFile('test/fixtures/camunda-implementations.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementation', input, '--id', 'Service_External', '--kind', 'externalTask', '--value', 'score-v2', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'implementation',
      result: { dryRun: false, written: true, outputFile: output, kind: 'externalTask' }
    });
    expect(written).toContain('camunda:type="external"');
    expect(written).toContain('camunda:topic="score-v2"');
  });

  it('prints format dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'format', 'test/fixtures/simple-linear.bpmn']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'format',
      result: {
        dryRun: true,
        written: false,
        before: { bytes: Buffer.byteLength(before, 'utf8') },
        after: { bytes: expect.any(Number) }
      }
    });
    expect(after).toBe(before);
  });

  it('writes format output to explicit path', async () => {
    const input = 'tmp/format-input.bpmn';
    const output = 'tmp/format-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'format', input, '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'format',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('<bpmn:definitions');
  });

  it('prints insert-task-between dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'insert-task-between', 'test/fixtures/simple-linear.bpmn', '--flow', 'Flow_Start_To_Task', '--id', 'Task_Review', '--name', 'Review', '--type', 'userTask']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'insert-task-between',
      result: {
        dryRun: true,
        written: false,
        inserted: { id: 'Task_Review', type: 'bpmn:UserTask' },
        warnings: [expect.objectContaining({ code: 'DI_NOT_UPDATED' })]
      }
    });
    expect(after).toBe(before);
  });

  it('writes insert-task-between output to explicit path', async () => {
    const input = 'tmp/insert-input.bpmn';
    const output = 'tmp/insert-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'insert-task-between', input, '--flow', 'Flow_Start_To_Task', '--id', 'Task_Review', '--name', 'Review', '--type', 'userTask', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'insert-task-between',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('<bpmn:userTask id="Task_Review" name="Review">');
  });

  it('prints connect dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'connect', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1', '--to', 'EndEvent_1', '--id', 'Flow_Start_To_End', '--name', 'skip']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'connect',
      result: {
        dryRun: true,
        written: false,
        flow: { id: 'Flow_Start_To_End', sourceId: 'StartEvent_1', targetId: 'EndEvent_1' },
        warnings: [expect.objectContaining({ code: 'DI_NOT_UPDATED' })]
      }
    });
    expect(after).toBe(before);
  });

  it('writes connect output to explicit path', async () => {
    const input = 'tmp/connect-input.bpmn';
    const output = 'tmp/connect-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'connect', input, '--from', 'StartEvent_1', '--to', 'EndEvent_1', '--id', 'Flow_Start_To_End', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'connect',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('<bpmn:sequenceFlow id="Flow_Start_To_End" sourceRef="StartEvent_1" targetRef="EndEvent_1" />');
  });

  it('prints delete-safe dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'delete-safe', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'delete-safe',
      result: {
        dryRun: true,
        written: false,
        deleted: { id: 'Task_1' },
        replacementFlow: { sourceId: 'StartEvent_1', targetId: 'EndEvent_1' },
        warnings: [expect.objectContaining({ code: 'DI_NOT_UPDATED' })]
      }
    });
    expect(after).toBe(before);
  });

  it('writes delete-safe output to explicit path', async () => {
    const input = 'tmp/delete-input.bpmn';
    const output = 'tmp/delete-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'delete-safe', input, '--id', 'Task_1', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'delete-safe',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).not.toContain('<bpmn:task id="Task_1"');
    expect(written).toContain('sourceRef="StartEvent_1" targetRef="EndEvent_1"');
  });

  it('prints add-boundary-event dry-run envelope without modifying input', async () => {
    const before = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');
    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'add-boundary-event', 'test/fixtures/simple-linear.bpmn', '--attached-to', 'Task_1', '--id', 'Boundary_Timeout', '--target', 'EndEvent_1', '--flow-id', 'Flow_Timeout_To_End', '--duration', 'PT10M']);
    const after = await readFile('test/fixtures/simple-linear.bpmn', 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'add-boundary-event',
      result: {
        dryRun: true,
        written: false,
        boundaryEvent: { id: 'Boundary_Timeout' },
        timer: { duration: 'PT10M', cancelActivity: true },
        warnings: [expect.objectContaining({ code: 'DI_NOT_UPDATED' })]
      }
    });
    expect(after).toBe(before);
  });

  it('writes add-boundary-event output to explicit path', async () => {
    const input = 'tmp/boundary-input.bpmn';
    const output = 'tmp/boundary-output.bpmn';
    await copyFile('test/fixtures/simple-linear.bpmn', input);

    const { stdout } = await execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'add-boundary-event', input, '--attached-to', 'Task_1', '--id', 'Boundary_Timeout', '--target', 'EndEvent_1', '--flow-id', 'Flow_Timeout_To_End', '--duration', 'PT10M', '--write', '-o', output]);
    const written = await readFile(output, 'utf8');

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'add-boundary-event',
      result: { dryRun: false, written: true, outputFile: output }
    });
    expect(written).toContain('<bpmn:boundaryEvent id="Boundary_Timeout" attachedToRef="Task_1">');
  });

  it('exits 1 for validation errors', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'validate', 'test/fixtures/broken-reference.bpmn'])).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('"valid":false')
    });
  });

  it('exits 2 for invalid events type filter', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'events', 'test/fixtures/boundary-timer.bpmn', '--type', 'gateway'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 1 when subprocess id is not subprocess-like', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'subprocess', 'test/fixtures/subprocess.bpmn', '--id', 'SubTask_1'])).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('UNSUPPORTED_BPMN_ELEMENT_TYPE')
    });
  });

  it('exits 2 when path is missing --to', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'path', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when rename dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'rename', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1', '--name', 'Review', '-o', 'tmp/invalid.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when documentation dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'documentation', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1', '--text', 'Docs', '-o', 'tmp/invalid-doc.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when implementation dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'implementation', 'test/fixtures/camunda-implementations.bpmn', '--id', 'Service_Delegate', '--kind', 'delegateExpression', '--value', '${newDelegate}', '-o', 'tmp/invalid-implementation.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when format dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'format', 'test/fixtures/simple-linear.bpmn', '-o', 'tmp/invalid-format.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when insert-task-between dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'insert-task-between', 'test/fixtures/simple-linear.bpmn', '--flow', 'Flow_Start_To_Task', '--id', 'Task_Review', '--name', 'Review', '-o', 'tmp/invalid-insert.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when connect dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'connect', 'test/fixtures/simple-linear.bpmn', '--from', 'StartEvent_1', '--to', 'EndEvent_1', '--id', 'Flow_Start_To_End', '-o', 'tmp/invalid-connect.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when delete-safe dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'delete-safe', 'test/fixtures/simple-linear.bpmn', '--id', 'Task_1', '-o', 'tmp/invalid-delete.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
    });
  });

  it('exits 2 when add-boundary-event dry-run uses output path', async () => {
    await expect(execFileAsync('npx', ['tsx', 'src/cli/main.ts', 'add-boundary-event', 'test/fixtures/simple-linear.bpmn', '--attached-to', 'Task_1', '--id', 'Boundary_Timeout', '--target', 'EndEvent_1', '--flow-id', 'Flow_Timeout_To_End', '--duration', 'PT10M', '-o', 'tmp/invalid-boundary.bpmn'])).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('INVALID_OPTION_VALUE')
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
