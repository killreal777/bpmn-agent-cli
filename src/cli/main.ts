#!/usr/bin/env node

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help') || args.length === 0) {
    process.stdout.write('Usage: bpmn-agent-cli <command> [file] [options]\n');
    return;
  }

  process.stdout.write(JSON.stringify({
    ok: false,
    error: {
      code: 'INVALID_COMMAND',
      message: `Unknown command: ${args[0]}`
    }
  }));
  process.exitCode = 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 5;
  });
}
