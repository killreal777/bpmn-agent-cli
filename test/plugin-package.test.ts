import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('agent extension metadata', () => {
  it('declares Qwen extension files', async () => {
    const manifest = JSON.parse(await readFile('qwen-extension.json', 'utf8'));

    expect(manifest).toEqual({
      name: 'bpmn-agent-cli',
      version: '0.1.0',
      contextFileName: 'QWEN.md',
      commands: 'commands',
      skills: 'skills'
    });
  });

  it('declares Claude plugin marketplace files', async () => {
    const marketplace = JSON.parse(await readFile('.claude-plugin/marketplace.json', 'utf8'));
    const plugin = JSON.parse(await readFile('.claude-plugin/plugin.json', 'utf8'));

    expect(marketplace.plugins[0]).toMatchObject({
      name: 'bpmn-agent-cli',
      source: './'
    });
    expect(plugin).toMatchObject({
      name: 'bpmn-agent-cli',
      skills: './skills/'
    });
  });

  it('documents bundled CLI invocation for agents', async () => {
    const command = await readFile('commands/bpmn-agent-cli.md', 'utf8');
    const skill = await readFile('skills/bpmn-agent-cli/SKILL.md', 'utf8');

    expect(command).toContain('${extensionPath}');
    expect(command).toContain('dist/extension/bpmn-agent-cli.cjs');
    expect(command).toContain('call-activity');
    expect(skill).toContain('name: bpmn-agent-cli');
    expect(skill).toContain('bpmn-agent-cli overview');
    expect(skill).toContain('bpmn-agent-cli call-activity');
    expect(skill).toContain('Prefer specialized CLI queries');
    await expect(access('commands/bpmn.md')).rejects.toThrow();
    await expect(access('skills/bpmn-agent/SKILL.md')).rejects.toThrow();
  });
});
