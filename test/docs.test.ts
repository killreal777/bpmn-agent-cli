import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('documentation', () => {
  it('documents installation, CLI commands, contracts, and roadmap', async () => {
    const readme = await readFile('README.md', 'utf8');
    const agents = await readFile('AGENTS.md', 'utf8');
    const cli = await readFile('docs/CLI.md', 'utf8');
    const contracts = await readFile('docs/OUTPUT_CONTRACTS.md', 'utf8');
    const roadmap = await readFile('docs/ROADMAP.md', 'utf8');

    expect(readme).toContain('bpmn-agent-cli');
    expect(readme).toContain('/extensions install https://github.com/killreal777/bpmn-agent-cli');
    expect(readme).toContain('/plugin marketplace add killreal777/bpmn-agent-cli');
    expect(agents).toContain('Do not implement a custom BPMN parser');
    expect(agents).toContain('npm test');
    expect(cli).toContain('bpmn-agent-cli overview process.bpmn');
    expect(cli).toContain('bpmn-agent-cli to-json process.bpmn --preset optimized');
    expect(cli).toContain('bpmn-agent-cli participants process.bpmn');
    expect(cli).toContain('bpmn-agent-cli lanes process.bpmn --element Task_1');
    expect(cli).toContain('bpmn-agent-cli events process.bpmn --type boundary');
    expect(cli).toContain('bpmn-agent-cli subprocess process.bpmn --id SubProcess_1');
    expect(cli).toContain('bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1');
    expect(readme).toContain('bpmn-agent-cli path process.bpmn --from StartEvent_1 --to EndEvent_1');
    expect(contracts).toContain('ELEMENT_NOT_FOUND');
    expect(contracts).toContain('ValidateResult');
    expect(contracts).toContain('ParticipantsResult');
    expect(contracts).toContain('LanesResult');
    expect(contracts).toContain('EventsResult');
    expect(contracts).toContain('SubprocessResult');
    expect(contracts).toContain('PathResult');
    expect(roadmap).toContain('P0');
    expect(roadmap).toContain('P1-A');
    expect(roadmap).toContain('P1');
    expect(roadmap).toContain('P2');
  });
});
