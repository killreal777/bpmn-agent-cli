import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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

function requireOption(options, name) {
  const value = options.get(name);
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required option ${name}`);
  }
  return value;
}

function optionalForward(options, name, args) {
  const value = options.get(name);
  if (typeof value === 'string') {
    args.push(name, value);
  }
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function buildRef(ref, label) {
  const worktreeDir = join(tmpdir(), 'bpmn-agent-cli-agent-ref-builds', `${label}-${safeName(ref)}`);
  await rm(worktreeDir, { recursive: true, force: true });
  await mkdir(worktreeDir, { recursive: true });
  await execFileAsync('git', ['worktree', 'add', '--detach', worktreeDir, ref], { timeout: 60000 });

  try {
    await execFileAsync('npm', ['ci'], { cwd: worktreeDir, timeout: 120000 });
    await execFileAsync('npm', ['run', 'build'], { cwd: worktreeDir, timeout: 120000 });
    return `node ${join(worktreeDir, 'dist/cli/main.js')}`;
  } catch (error) {
    await execFileAsync('git', ['worktree', 'remove', '--force', worktreeDir]).catch(() => undefined);
    throw error;
  }
}

async function resolveCliCommand(options, commandOption, refOption, label) {
  const explicit = options.get(commandOption);
  if (typeof explicit === 'string') {
    return explicit;
  }

  const ref = options.get(refOption);
  if (typeof ref === 'string') {
    return buildRef(ref, label);
  }

  throw new Error(`Provide ${commandOption} or ${refOption}`);
}

async function runNpmScript(script, args, timeoutMs) {
  await execFileAsync('npm', ['run', script, '--', ...args], { timeout: timeoutMs });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const task = requireOption(options, '--task');
  const outputDir = resolve(options.get('--output-dir') ?? 'benchmarks/results/agent-ref-compare');
  const timeoutMs = Number(options.get('--timeout-ms') ?? 240000);
  const baselineVariant = options.get('--baseline-variant') ?? 'agent-baseline';
  const candidateVariant = options.get('--candidate-variant') ?? 'agent-candidate';
  const baselineOutput = join(outputDir, 'agent-baseline.json');
  const candidateOutput = join(outputDir, 'agent-candidate.json');
  const compareOutput = join(outputDir, 'compare-agent.json');
  const baselineCliCommand = await resolveCliCommand(options, '--baseline-cli-command', '--baseline-ref', 'baseline');
  const candidateCliCommand = await resolveCliCommand(options, '--candidate-cli-command', '--candidate-ref', 'candidate');

  await mkdir(outputDir, { recursive: true });

  const commonArgs = ['--task', task];
  optionalForward(options, '--agent', commonArgs);
  optionalForward(options, '--agent-command', commonArgs);
  optionalForward(options, '--timeout-ms', commonArgs);

  await runNpmScript('benchmark:agent', [
    '--variant',
    baselineVariant,
    ...commonArgs,
    '--cli-command',
    baselineCliCommand,
    '--output',
    baselineOutput
  ], timeoutMs + 30000);

  await runNpmScript('benchmark:agent', [
    '--variant',
    candidateVariant,
    ...commonArgs,
    '--cli-command',
    candidateCliCommand,
    '--output',
    candidateOutput
  ], timeoutMs + 30000);

  await runNpmScript('benchmark:compare', [
    '--baseline',
    baselineOutput,
    '--candidate',
    candidateOutput,
    '--output',
    compareOutput
  ], 30000);

  process.stdout.write(`${JSON.stringify({
    baseline: baselineOutput,
    candidate: candidateOutput,
    compare: compareOutput
  })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
