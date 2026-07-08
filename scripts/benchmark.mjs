import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const options = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options.set(item, next);
      index += 1;
    } else {
      options.set(item, true);
    }
  }

  return options;
}

function estimateTokens(bytes) {
  return Math.ceil(bytes / 4);
}

async function loadTasks(filterTaskId) {
  const files = (await readdir('benchmarks/tasks')).filter((file) => file.endsWith('.json')).sort();
  const tasks = [];

  for (const file of files) {
    const task = JSON.parse(await readFile(join('benchmarks/tasks', file), 'utf8'));
    if (!filterTaskId || task.id === filterTaskId) {
      tasks.push(task);
    }
  }

  return tasks;
}

function resolveCliCall(call, fixturePath, metricsPath) {
  return call.map((value) => value === '$fixture' ? fixturePath : value).concat(['--trace-metrics', metricsPath]);
}

async function runCliCall(call, fixturePath, metricsPath) {
  const args = ['tsx', 'src/cli/main.ts', ...resolveCliCall(call, fixturePath, metricsPath)];
  const startedAt = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync('npx', args, { timeout: 30000 });
    const stdoutBytes = Buffer.byteLength(stdout, 'utf8');

    return {
      command: call[0],
      args: call.slice(1),
      exitCode: 0,
      elapsedMs: Date.now() - startedAt,
      stdoutBytes,
      estimatedOutputTokens: estimateTokens(stdoutBytes),
      stderrBytes: Buffer.byteLength(stderr, 'utf8'),
      error: null
    };
  } catch (error) {
    const stdout = typeof error.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error.stderr === 'string' ? error.stderr : '';
    const stdoutBytes = Buffer.byteLength(stdout, 'utf8');

    return {
      command: call[0],
      args: call.slice(1),
      exitCode: typeof error.code === 'number' ? error.code : 1,
      elapsedMs: Date.now() - startedAt,
      stdoutBytes,
      estimatedOutputTokens: estimateTokens(stdoutBytes),
      stderrBytes: Buffer.byteLength(stderr, 'utf8'),
      error: error.message
    };
  }
}

async function runTask(task, variant) {
  const fixturePath = join('benchmarks/fixtures', task.fixture);
  const metricsPath = join('tmp', `benchmark-${variant}-${task.id}.jsonl`);
  await rm(metricsPath, { force: true });

  const startedAt = Date.now();
  const cliCalls = [];

  for (const call of task.cliCalls ?? []) {
    cliCalls.push(await runCliCall(call, fixturePath, metricsPath));
  }

  const success = cliCalls.every((call) => call.exitCode === 0);
  const stdoutBytes = cliCalls.reduce((sum, call) => sum + call.stdoutBytes, 0);
  const estimatedOutputTokens = cliCalls.reduce((sum, call) => sum + call.estimatedOutputTokens, 0);

  return {
    id: task.id,
    title: task.title,
    fixture: task.fixture,
    category: task.category,
    success,
    correctnessScore: success ? null : 0,
    manualReviewRequired: Boolean(task.scoring?.manualReviewRequired),
    elapsedMs: Date.now() - startedAt,
    cliCallCount: cliCalls.length,
    stdoutBytes,
    estimatedOutputTokens,
    xmlFallback: false,
    toolErrors: cliCalls.filter((call) => call.exitCode !== 0).map((call) => ({
      command: call.command,
      exitCode: call.exitCode,
      error: call.error
    })),
    cliCalls
  };
}

function aggregate(tasks) {
  const successfulTasks = tasks.filter((task) => task.success).length;
  const cliCalls = tasks.reduce((sum, task) => sum + task.cliCallCount, 0);
  const toolErrors = tasks.reduce((sum, task) => sum + task.toolErrors.length, 0);

  return {
    successfulTasks,
    failedTasks: tasks.length - successfulTasks,
    successRate: tasks.length === 0 ? 0 : successfulTasks / tasks.length,
    cliCalls,
    elapsedMs: tasks.reduce((sum, task) => sum + task.elapsedMs, 0),
    stdoutBytes: tasks.reduce((sum, task) => sum + task.stdoutBytes, 0),
    estimatedOutputTokens: tasks.reduce((sum, task) => sum + task.estimatedOutputTokens, 0),
    xmlFallbackRate: 0,
    toolErrors,
    toolErrorRate: cliCalls === 0 ? 0 : toolErrors / cliCalls
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const variant = options.get('--variant') ?? 'baseline';
  const filterTaskId = options.get('--task') ?? null;
  const output = options.get('--output') ?? join('benchmarks/results', `${variant}.json`);

  const tasks = await loadTasks(filterTaskId);
  if (tasks.length === 0) {
    throw new Error(`No benchmark tasks matched ${filterTaskId ?? 'all tasks'}`);
  }

  const results = [];
  for (const task of tasks) {
    results.push(await runTask(task, variant));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    variant,
    taskCount: results.length,
    taskSource: filterTaskId ? basename(`${filterTaskId}.json`) : 'benchmarks/tasks',
    aggregate: aggregate(results),
    tasks: results
  };

  await mkdir(join(output, '..'), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report.aggregate)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
