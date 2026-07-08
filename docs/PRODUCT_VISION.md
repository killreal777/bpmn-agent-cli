# Product Vision

## Positioning

`bpmn-agent-cli` is a local, deterministic BPMN workbench for coding agents and engineers. It turns BPMN files from large XML documents into small, reliable command results that agents can inspect, validate, explain, and safely change.

The product should become the default utility an agent reaches for before reading raw BPMN XML or editing process files by hand.

## Primary Users

- Agentic coding tools that need compact BPMN context and safe BPMN edits.
- Backend engineers maintaining Camunda or BPMN-based workflows.
- BPM/process analysts who need reliable summaries, diffs, and validation without opening a graphical modeler.
- Reviewers who need machine-readable change summaries in CI and pull requests.

## Product Principles

- Local first: no runtime network calls and no LLM calls during BPMN analysis.
- Deterministic output: stable JSON contracts, stable sorting, stable exit codes.
- Agent-sized context: prefer focused commands over full XML dumps.
- Metric-first reading: accept new read features based on benchmarked token cost, correctness, speed, and XML fallback impact.
- Dry-run first: all write commands default to no file changes.
- Safety over coverage: refuse unsupported writes instead of silently dropping BPMN semantics.
- Parser-owned BPMN semantics: use `bpmn-moddle` and descriptors; do not build a custom BPMN parser.
- Extension-ready: Qwen and Claude installs must run from the committed self-contained bundle.

## Product Layers

1. Read and explain BPMN.
2. Validate and lint BPMN.
3. Safely patch BPMN semantics.
4. Generate reviewable diffs and reports.
5. Support batch, CI, and agent workflow integration.
6. Optionally support visual layout once semantic editing is stable.

## Near-Term Direction

The near-term product should shift back toward read-side understanding after completing safe structural editing:

- Build the reading benchmark and metrics foundation before expanding large read features.
- Run baseline measurements against the current CLI.
- Make process variables and CallActivity mappings first-class read concepts.
- Enrich `element` with type-specific details so agents can inspect one element without raw XML.
- Deprecate legacy `to-json` as a primary workflow.
- Add semantic lint rules that catch common Camunda/BPMN mistakes.
- Add `diff` and `plan` commands so write operations become easier to review.
- Add CI-friendly report output for repository-wide BPMN checks.
- Add BPMNDI layout support only after semantic edits and validation are reliable.

## Non-Goals

- Replacing graphical BPMN modelers.
- Runtime workflow execution.
- Hidden automatic rewrites without explicit `--write`.
- LLM-powered analysis inside the CLI runtime.
- Lossy conversion as the default command behavior.
