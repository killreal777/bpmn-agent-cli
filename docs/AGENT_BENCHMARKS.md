# Agent Benchmarks

`benchmark:agent` runs benchmark tasks through an agent instead of executing predeclared `cliCalls`.

The runner creates a task prompt, injects a temporary `bpmn-agent-cli` wrapper at the front of `PATH`, asks the agent to solve the task, and collects the CLI metrics produced by the agent's real tool usage.

## Commands

Run a task with Codex:

```bash
npm run benchmark:agent -- \
  --variant codex-current \
  --task T1-overview-linear \
  --agent codex \
  --output benchmarks/results/agent-codex-current.json
```

Run the same agent task against a specific CLI build:

```bash
npm run benchmark:agent -- \
  --variant codex-old-cli \
  --task T1-overview-linear \
  --agent codex \
  --cli-command 'node /tmp/bpmn-agent-cli-old/dist/cli/main.js' \
  --output benchmarks/results/agent-codex-old-cli.json
```

Run a task with a custom agent command:

```bash
npm run benchmark:agent -- \
  --variant custom-agent \
  --task T1-overview-linear \
  --agent-command 'my-agent --prompt-file {promptFile} --answer-file {answerFile}' \
  --output benchmarks/results/agent-custom.json
```

Compare two agent reports:

```bash
npm run benchmark:compare -- \
  --baseline benchmarks/results/agent-baseline.json \
  --candidate benchmarks/results/agent-candidate.json \
  --output benchmarks/results/compare-agent.json
```

## How Metrics Are Collected

For every task, the runner writes:

- `prompt.md`: the task prompt given to the agent.
- `answer.md`: the final answer file the agent must write.
- `cli-metrics.jsonl`: real `bpmn-agent-cli` invocations captured through the PATH wrapper.

The report includes:

- `cliCallCount`: how many times the agent invoked `bpmn-agent-cli`.
- `estimatedOutputTokens`: estimated tokens from CLI output seen by the agent.
- `estimatedAgentOutputTokens`: estimated tokens from agent stdout/stderr plus final answer.
- `answerCorrectnessScore`: rubric score from `0` to `3` based on task success criteria keyword matching.
- `matchedCriteria` and `missingCriteria`.
- `xmlFallback`: whether raw BPMN XML appeared in the agent answer/stdout/stderr.
- `toolErrors`: failed captured CLI calls.

This is still an automated proxy for correctness. Ambiguous or important runs should be manually reviewed, especially when `missingCriteria` is non-empty.

## Codex Preset

`--agent codex` runs:

```bash
codex --ask-for-approval never exec --sandbox workspace-write --ephemeral --ignore-rules --skip-git-repo-check -
```

The prompt is passed on stdin. The agent runs in the repository root and receives these environment variables:

- `BPMN_AGENT_TASK_ID`
- `BPMN_AGENT_FIXTURE`
- `BPMN_AGENT_PROMPT_FILE`
- `BPMN_AGENT_ANSWER_FILE`
- `BPMN_AGENT_METRICS_FILE`

The benchmark remains local. The CLI itself still performs no LLM or network calls during BPMN analysis.

Codex agent runs require a working Codex login and available usage quota. CI should not depend on live Codex availability; use `--agent-command` with a deterministic fake or local agent for smoke tests.
