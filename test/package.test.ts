import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('package metadata', () => {
  it('exposes the bpmn-agent-cli binary and required scripts', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      name: string;
      type: string;
      bin: Record<string, string>;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(pkg.name).toBe('bpmn-agent-cli');
    expect(pkg.type).toBe('module');
    expect(pkg.bin['bpmn-agent-cli']).toBe('./dist/cli/main.js');
    expect(pkg.scripts).toMatchObject({
      build: 'tsc',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
      'build:extension': 'npm run build && node scripts/build-extension.mjs'
    });
    expect(pkg.dependencies).toHaveProperty('bpmn-moddle');
    expect(pkg.dependencies).toHaveProperty('camunda-bpmn-moddle');
    expect(pkg.devDependencies).toHaveProperty('esbuild');
    expect(pkg.devDependencies).toHaveProperty('vitest');
  });

  it('uses convert terminology for the active JSON conversion module', async () => {
    await expect(access('src/convert/convert.ts')).resolves.toBeUndefined();
    await expect(access('test/convert/convert.test.ts')).resolves.toBeUndefined();
    await expect(access('src/legacy/convert.ts')).rejects.toThrow();
    await expect(access('test/legacy/convert.test.ts')).rejects.toThrow();
  });
});
