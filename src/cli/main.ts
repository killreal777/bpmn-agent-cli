#!/usr/bin/env node

import { BpmnCliError } from '../bpmn/errors.js';
import { errorEnvelope, toExitCode, writeJson } from '../output/jsonOutput.js';
import { parseArgs } from './args.js';
import { addBoundaryEventCommand } from './commands/addBoundaryEventCommand.js';
import { connectCommand } from './commands/connectCommand.js';
import { contextCommand } from './commands/contextCommand.js';
import { deleteSafeCommand } from './commands/deleteSafeCommand.js';
import { documentationCommand } from './commands/documentationCommand.js';
import { elementCommand } from './commands/elementCommand.js';
import { exportCommand } from './commands/exportCommand.js';
import { eventsCommand } from './commands/eventsCommand.js';
import { findCommand } from './commands/findCommand.js';
import { formatCommand } from './commands/formatCommand.js';
import { gatewayCommand } from './commands/gatewayCommand.js';
import { implementationCommand } from './commands/implementationCommand.js';
import { implementationsCommand } from './commands/implementationsCommand.js';
import { insertTaskBetweenCommand } from './commands/insertTaskBetweenCommand.js';
import { lanesCommand } from './commands/lanesCommand.js';
import { overviewCommand } from './commands/overviewCommand.js';
import { pathCommand } from './commands/pathCommand.js';
import { participantsCommand } from './commands/participantsCommand.js';
import { renameCommand } from './commands/renameCommand.js';
import { subprocessCommand } from './commands/subprocessCommand.js';
import { traceCommand } from './commands/traceCommand.js';
import { toJsonCommand } from './commands/toJsonCommand.js';
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

    if (parsed.command === 'trace') {
      writeJson(await traceCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'context') {
      writeJson(await contextCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'implementations') {
      writeJson(await implementationsCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'participants') {
      writeJson(await participantsCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'lanes') {
      writeJson(await lanesCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'events') {
      writeJson(await eventsCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'subprocess') {
      writeJson(await subprocessCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'path') {
      writeJson(await pathCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'export') {
      await exportCommand(parsed, pretty);
      return;
    }

    if (parsed.command === 'rename') {
      writeJson(await renameCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'documentation') {
      writeJson(await documentationCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'implementation') {
      writeJson(await implementationCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'format') {
      writeJson(await formatCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'insert-task-between') {
      writeJson(await insertTaskBetweenCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'connect') {
      writeJson(await connectCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'delete-safe') {
      writeJson(await deleteSafeCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'add-boundary-event') {
      writeJson(await addBoundaryEventCommand(parsed), pretty);
      return;
    }

    if (parsed.command === 'to-json') {
      await toJsonCommand(parsed, pretty);
      return;
    }

    throw new BpmnCliError('INVALID_COMMAND', `Unknown command: ${parsed.command}`, 2);
  } catch (error: unknown) {
    writeJson(errorEnvelope(error), pretty);
    process.exitCode = process.exitCode ?? toExitCode(error);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 5;
});
