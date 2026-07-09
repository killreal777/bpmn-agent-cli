# Agent Benchmarks

`benchmark:agent` runs benchmark tasks through an agent instead of executing predeclared `cliCalls`.

The runner creates a task prompt, injects a temporary `bpmn-agent-cli` wrapper at the front of `PATH`, asks the agent to solve the task, and collects the CLI metrics produced by the agent's real tool usage.

An agent task is not counted as successful unless at least one `bpmn-agent-cli` invocation is captured. A correct-looking answer without captured CLI calls is treated as failed because it does not prove the tool helped the agent.

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

Run the same agent task against two CLI refs and compare the resulting reports:

```bash
npm run benchmark:agent:refs -- \
  --task T9-variables-call-activity \
  --agent codex \
  --baseline-ref 5074ac6 \
  --candidate-ref main \
  --output-dir benchmarks/results/agent-vars-ref-compare
```

For already-built CLI binaries, pass commands instead of Git refs:

```bash
npm run benchmark:agent:refs -- \
  --task T9-variables-call-activity \
  --agent-command 'my-agent --prompt-file {promptFile} --answer-file {answerFile}' \
  --baseline-cli-command 'node /tmp/bpmn-agent-cli-old/dist/cli/main.js' \
  --candidate-cli-command 'node "$(pwd)/dist/cli/main.js"' \
  --output-dir benchmarks/results/agent-vars-command-compare
```

`benchmark:agent:refs` writes:

- `agent-baseline.json`: agent benchmark report for `--baseline-ref` or `--baseline-cli-command`.
- `agent-candidate.json`: agent benchmark report for `--candidate-ref` or `--candidate-cli-command`.
- `compare-agent.json`: `benchmark:compare` output with metric deltas.

Git refs are checked out into temporary detached worktrees, built with `npm ci` and `npm run build`, then used through their own `dist/cli/main.js`.

## How Metrics Are Collected

For every task, the runner writes:

- `prompt.md`: the task prompt given to the agent.
- `answer.md`: the final answer file the agent must write.
- `/tmp/bpmn-agent-cli-agent-benchmark/<variant>/<task>/cli-metrics.jsonl`: real `bpmn-agent-cli` invocations captured through the PATH wrapper or explicit `--trace-metrics`.

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
