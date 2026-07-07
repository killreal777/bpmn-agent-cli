#!/usr/bin/env node

import { BpmnCliError } from '../bpmn/errors.js';
import { errorEnvelope, toExitCode, writeJson } from '../output/jsonOutput.js';
import { parseArgs } from './args.js';
import { elementCommand } from './commands/elementCommand.js';
import { findCommand } from './commands/findCommand.js';
import { gatewayCommand } from './commands/gatewayCommand.js';
import { overviewCommand } from './commands/overviewCommand.js';
import { validateCommand } from './commands/validateCommand.js';

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help') || args.length === 0) {
    process.stdout.write('Usage: bpmn-agent-cli <command> [file] [options]\n');
    return;
  }

  const parsed = parseArgs(args);
  const pretty = parsed.options.get('--pretty') === true;

  try {
    if (parsed.command === 'overview') {
      writeJson(await overviewCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'validate') {
      writeJson(await validateCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'find') {
      writeJson(await findCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'element') {
      writeJson(await elementCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'gateway') {
      writeJson(await gatewayCommand(parsed), pretty);
      return;
    }

    throw new BpmnCliError('INVALID_COMMAND', `Unknown command: ${parsed.command}`, 2);
  } catch (error: unknown) {
    writeJson(errorEnvelope(error), pretty);
    process.exitCode = process.exitCode ?? toExitCode(error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 5;
  });
}
