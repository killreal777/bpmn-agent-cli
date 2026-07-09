import { execFile, spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, delimiter, join, resolve } from 'node:path';
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

async function writeCliWrapper(binDir, metricsPath, cliCommand) {
  await mkdir(binDir, { recursive: true });
  const wrapperPath = join(binDir, 'bpmn-agent-cli');
  await writeFile(wrapperPath, [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `${cliCommand} "$@" --trace-metrics "$BPMN_AGENT_METRICS_FILE"`
  ].join('\n') + '\n');
  await execFileAsync('chmod', ['+x', wrapperPath]);
  return wrapperPath;
}

function buildPrompt(task, fixturePath, answerPath, metricsPath, cliCommand) {
  return [
    `You are evaluating bpmn-agent-cli on benchmark task ${task.id}.`,
    '',
    'Rules:',
    '- Use BPMN CLI commands to inspect BPMN; do not guess.',
    `- Preferred metrics-safe CLI form: ${cliCommand} <command> ${fixturePath} [options] --trace-metrics ${metricsPath}`,
    '- You may also use the `bpmn-agent-cli` command available on PATH; it is wrapped to add metrics.',
    '- Do not read raw BPMN XML unless targeted CLI commands cannot answer the task.',
    '- Write the final answer to the answer file path shown below.',
    '- The final answer file must contain the actual benchmark answer, not a note saying you wrote it.',
    '- Keep the answer concise and include concrete BPMN ids/names needed by the task.',
    '',
    `Fixture: ${fixturePath}`,
    `Answer file: ${answerPath}`,
    '',
    `Task title: ${task.title}`,
    `Task prompt: ${task.prompt}`,
    '',
    'Success criteria:',
    ...(task.successCriteria ?? []).map((criterion) => `- ${criterion}`)
  ].join('\n');
}

function runCommand(command, env, stdin, cwd, timeoutMs) {
  return new Promise((resolveResult) => {
    const startedAt = Date.now();
    const child = spawn(command.command, command.args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const stdoutBuffer = Buffer.concat(stdout);
      const stderrBuffer = Buffer.concat(stderr);
      resolveResult({
        exitCode: typeof code === 'number' ? code : 1,
        signal,
        elapsedMs: Date.now() - startedAt,
        stdout: stdoutBuffer.toString('utf8'),
        stderr: stderrBuffer.toString('utf8'),
        stdoutBytes: stdoutBuffer.byteLength,
        stderrBytes: stderrBuffer.byteLength
      });
    });

    child.stdin.end(stdin);
  });
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function renderCommandTemplate(template, context) {
  return template
    .replaceAll('{promptFile}', shellEscape(context.promptPath))
    .replaceAll('{answerFile}', shellEscape(context.answerPath))
    .replaceAll('{fixture}', shellEscape(context.fixturePath))
    .replaceAll('{taskId}', shellEscape(context.taskId))
    .replaceAll('{workspace}', shellEscape(process.cwd()))
    .replaceAll('{binDir}', shellEscape(context.binDir));
}

function commandForAgent(options, prompt, context) {
  const agent = options.get('--agent') ?? null;
  const agentCommand = options.get('--agent-command') ?? null;

  if (agentCommand) {
    return {
      command: '/bin/sh',
      args: ['-lc', renderCommandTemplate(agentCommand, context)]
    };
  }

  if (agent === 'codex') {
    return {
      command: 'codex',
      args: [
        '--ask-for-approval',
        'never',
        'exec',
        '--sandbox',
        'workspace-write',
        '--ephemeral',
        '--ignore-rules',
        '--skip-git-repo-check',
        '-'
      ],
      stdin: prompt
    };
  }

  throw new Error('Provide --agent codex or --agent-command <executable>');
}

async function readJsonl(path) {
  try {
    const text = await readFile(path, 'utf8');
    return text.trim() === ''
      ? []
      : text.trim().split('\n').map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function normalize(value) {
  return value.toLocaleLowerCase().replace(/[`"'.]/g, '').replace(/\s+/g, ' ').trim();
}

function criterionNeedle(criterion) {
  return normalize(criterion)
    .replace(/^mentions /, '')
    .replace(/^includes /, '')
    .replace(/^returns /, '')
    .replace(/^path reaches /, '')
    .replace(/^does not read /, '')
    .replace(/^does not rely on /, '')
    .trim();
}

function scoreAnswer(answer, successCriteria, context) {
  const normalizedAnswer = normalize(answer);
  const criteria = successCriteria ?? [];
  const matchedCriteria = [];
  const missingCriteria = [];

  for (const criterion of criteria) {
    const needle = criterionNeedle(criterion);
    if (
      !needle
      || normalizedAnswer.includes(needle)
      || (needle === 'raw bpmn xml' && context.xmlFallback === false)
    ) {
      matchedCriteria.push(criterion);
    } else {
      missingCriteria.push(criterion);
    }
  }

  const ratio = criteria.length === 0 ? 1 : matchedCriteria.length / criteria.length;
  return {
    answerCorrectnessScore: Math.round(ratio * 3),
    matchedCriteria,
    missingCriteria
  };
}

function detectXmlFallback(text) {
  return /<\?xml|<bpmn:/i.test(text);
}

async function runTask(task, options, variant) {
  const fixturePath = join('benchmarks/fixtures', task.fixture);
  const cliCommand = options.get('--cli-command') ?? 'node "$(pwd)/dist/cli/main.js"';
  const taskDir = join('tmp', 'agent-benchmark', variant, task.id);
  const binDir = join(taskDir, 'bin');
  const answerPath = join(taskDir, 'answer.md');
  const promptPath = join(taskDir, 'prompt.md');
  const metricsPath = join(tmpdir(), 'bpmn-agent-cli-agent-benchmark', variant, task.id, 'cli-metrics.jsonl');
  await rm(taskDir, { recursive: true, force: true });
  await rm(metricsPath, { force: true });
  await mkdir(taskDir, { recursive: true });
  await writeCliWrapper(binDir, metricsPath, cliCommand);

  const prompt = buildPrompt(task, fixturePath, answerPath, metricsPath, cliCommand);
  await writeFile(promptPath, prompt, 'utf8');

  const env = {
    ...process.env,
    PATH: `${resolve(binDir)}${delimiter}${process.env.PATH ?? ''}`,
    BPMN_AGENT_TASK_ID: task.id,
    BPMN_AGENT_FIXTURE: fixturePath,
    BPMN_AGENT_PROMPT_FILE: promptPath,
    BPMN_AGENT_ANSWER_FILE: answerPath,
    BPMN_AGENT_METRICS_FILE: metricsPath
  };
  const command = commandForAgent(options, prompt, {
    taskId: task.id,
    fixturePath,
    answerPath,
    promptPath,
    binDir
  });
  const result = await runCommand(command, env, command.stdin ?? prompt, process.cwd(), Number(options.get('--timeout-ms') ?? 120000));
  const answer = await readFile(answerPath, 'utf8').catch(() => '');
  const xmlFallback = detectXmlFallback(answer) || detectXmlFallback(result.stdout) || detectXmlFallback(result.stderr);
  const cliCalls = await readJsonl(metricsPath);
  const scoring = scoreAnswer(answer, task.successCriteria, { xmlFallback });
  const cliOutputTokens = cliCalls.reduce((sum, call) => sum + (call.estimatedOutputTokens ?? 0), 0);
  const cliOutputBytes = cliCalls.reduce((sum, call) => sum + (call.stdoutBytes ?? 0), 0);
  const toolErrors = cliCalls.filter((call) => call.exitCode !== 0);
  const success = result.exitCode === 0 && scoring.answerCorrectnessScore > 0 && cliCalls.length > 0 && toolErrors.length === 0;

  return {
    id: task.id,
    title: task.title,
    fixture: task.fixture,
    category: task.category,
    cliCommand,
    success,
    answerCorrectnessScore: scoring.answerCorrectnessScore,
    matchedCriteria: scoring.matchedCriteria,
    missingCriteria: scoring.missingCriteria,
    manualReviewRequired: Boolean(task.scoring?.manualReviewRequired),
    elapsedMs: result.elapsedMs,
    agentExitCode: result.exitCode,
    agentStdoutBytes: result.stdoutBytes,
    agentStderrBytes: result.stderrBytes,
    agentStdoutPreview: result.stdout.slice(0, 2000),
    agentStderrPreview: result.stderr.slice(0, 2000),
    estimatedAgentOutputTokens: estimateTokens(result.stdoutBytes + result.stderrBytes + Buffer.byteLength(answer, 'utf8')),
    cliCallCount: cliCalls.length,
    cliOutputBytes,
    estimatedOutputTokens: cliOutputTokens,
    xmlFallback,
    answerPath,
    promptPath,
    metricsPath,
    toolErrors: toolErrors.map((call) => ({
      command: call.command,
      exitCode: call.exitCode,
      errorCode: call.errorCode
    })),
    cliCalls
  };
}

function aggregate(tasks) {
  const successfulTasks = tasks.filter((task) => task.success).length;
  const cliCalls = tasks.reduce((sum, task) => sum + task.cliCallCount, 0);
  const toolErrors = tasks.reduce((sum, task) => sum + task.toolErrors.length, 0);
  const xmlFallbacks = tasks.filter((task) => task.xmlFallback).length;

  return {
    successfulTasks,
    failedTasks: tasks.length - successfulTasks,
    successRate: tasks.length === 0 ? 0 : successfulTasks / tasks.length,
    answerCorrectnessScore: tasks.reduce((sum, task) => sum + task.answerCorrectnessScore, 0),
    averageCorrectnessScore: tasks.length === 0 ? 0 : tasks.reduce((sum, task) => sum + task.answerCorrectnessScore, 0) / tasks.length,
    cliCalls,
    elapsedMs: tasks.reduce((sum, task) => sum + task.elapsedMs, 0),
    stdoutBytes: tasks.reduce((sum, task) => sum + task.cliOutputBytes, 0),
    estimatedOutputTokens: tasks.reduce((sum, task) => sum + task.estimatedOutputTokens, 0),
    estimatedAgentOutputTokens: tasks.reduce((sum, task) => sum + task.estimatedAgentOutputTokens, 0),
    xmlFallbackRate: tasks.length === 0 ? 0 : xmlFallbacks / tasks.length,
    toolErrors,
    toolErrorRate: cliCalls === 0 ? 0 : toolErrors / cliCalls
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const variant = options.get('--variant') ?? 'agent';
  const filterTaskId = options.get('--task') ?? null;
  const output = options.get('--output') ?? join('benchmarks/results', `${variant}.agent.json`);
  const tasks = await loadTasks(filterTaskId);
  if (tasks.length === 0) {
    throw new Error(`No benchmark tasks matched ${filterTaskId ?? 'all tasks'}`);
  }

  const results = [];
  for (const task of tasks) {
    results.push(await runTask(task, options, variant));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    variant,
    mode: 'agent',
    cliCommand: options.get('--cli-command') ?? 'node "$(pwd)/dist/cli/main.js"',
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
