---
name: bpmn-agent-cli
summary: Read and analyze BPMN 2.0 files through the local bpmn-agent-cli CLI.
description: Use this skill when working with .bpmn files. Prefer specialized CLI queries over reading raw BPMN XML.
---

# BPMN Agent CLI

Prefer specialized CLI queries over reading raw BPMN XML. The CLI returns small deterministic JSON results that are easier for agents to use safely.

## Workflow

1. Start with `bpmn-agent-cli overview <file>` to understand the diagram.
2. Use `bpmn-agent-cli find <file> --query "<text>"` to locate elements by id, name, or type.
3. Use `bpmn-agent-cli element <file> --id <elementId>` for exact structural details.
4. Use `bpmn-agent-cli context <file> --id <elementId>` for before/after local flow context.
5. Use `bpmn-agent-cli gateway <file> --id <gatewayId>` for branch explanation.
6. Use `bpmn-agent-cli trace <file> --from <elementId>` for forward control-flow paths.
7. Use `bpmn-agent-cli trace <file> --from <elementId> --direction backward` for backward flow.
8. Use `bpmn-agent-cli implementations <file>` to find Camunda delegates, external task topics, forms, and call activities.
9. Use `bpmn-agent-cli validate <file>` before making conclusions about structural correctness.
10. Use `bpmn-agent-cli participants <file>` to inspect pools, participants, and message flows.
11. Use `bpmn-agent-cli lanes <file> --element <elementId>` to understand lane ownership for an element.
12. Use `bpmn-agent-cli events <file> --type boundary` to inspect event triggers and boundary handling.
13. Use `bpmn-agent-cli subprocess <file> --id <subprocessId>` to inspect direct subprocess contents.
14. Use `bpmn-agent-cli path <file> --from <sourceId> --to <targetId>` to answer reachability questions.
15. Use `bpmn-agent-cli export <file> --format markdown` to produce compact shareable BPMN context.

Do not manually rewrite BPMN XML. P0 is read-only except for the legacy `to-json` output command.

## Bundled CLI

When running from an installed Qwen extension command, invoke:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" overview process.bpmn
```

In a development checkout, use:

```bash
npm run start -- overview process.bpmn
```
