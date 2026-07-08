export type ParsedArgs = {
  command: string;
  file: string | null;
  options: Map<string, string | boolean>;
};

export function parseArgs(args: string[]): ParsedArgs {
  const [command, candidateFile, ...rest] = args;
  const options = new Map<string, string | boolean>();
  const file = candidateFile && !candidateFile.startsWith('-') ? candidateFile : null;
  const optionArgs = file ? rest : [candidateFile, ...rest].filter((value): value is string => Boolean(value));

  for (let index = 0; index < optionArgs.length; index += 1) {
    const item = optionArgs[index];
    if (!item.startsWith('--') && item !== '-o') {
      continue;
    }

    const next = optionArgs[index + 1];
    if (next && !next.startsWith('-')) {
      options.set(item, next);
      index += 1;
    } else {
      options.set(item, true);
    }
  }

  return { command: command ?? '', file, options };
}
