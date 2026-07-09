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
4. Use `bpmn-agent-cli context <file> --id <elementId> --profile agent` for compact before/after local flow context; omit `--profile agent` only when full path node objects are needed.
5. Use `bpmn-agent-cli gateway <file> --id <gatewayId>` for branch explanation.
6. Use `bpmn-agent-cli trace <file> --from <elementId>` for forward control-flow paths.
7. Use `bpmn-agent-cli trace <file> --from <elementId> --direction backward` for backward flow.
8. Use `bpmn-agent-cli implementations <file>` to find Camunda delegates, external task topics, forms, and call activities.
9. Use `bpmn-agent-cli variables <file>` to inspect process variable usage, expressions, and CallActivity mappings.
10. Use `bpmn-agent-cli call-activity <file> --id <callActivityId>` to inspect called element, in/out mappings, pass-through variables, and business key mappings.
11. Use `bpmn-agent-cli diff --base <before.bpmn> --candidate <after.bpmn>` to compare two BPMN versions semantically.
12. Use `bpmn-agent-cli impact <file> --id <elementId>` to inspect upstream/downstream paths and semantically attached artifacts before assessing a change.
13. Use `bpmn-agent-cli validate <file>` before making conclusions about structural correctness.
14. Use `bpmn-agent-cli participants <file>` to inspect pools, participants, and message flows.
15. Use `bpmn-agent-cli lanes <file> --element <elementId>` to understand lane ownership for an element.
16. Use `bpmn-agent-cli events <file> --type boundary` to inspect event triggers and boundary handling.
17. Use `bpmn-agent-cli subprocess <file> --id <subprocessId>` to inspect direct subprocess contents.
18. Use `bpmn-agent-cli path <file> --from <sourceId> --to <targetId>` to answer reachability questions.
19. Use `bpmn-agent-cli export <file> --format markdown` to produce compact shareable BPMN context.
20. Use `bpmn-agent-cli rename <file> --id <elementId> --name "<new name>"` for dry-run rename planning; add `--write` only when explicitly asked to modify BPMN files.
21. Use `bpmn-agent-cli documentation <file> --id <elementId> --text "<text>"` for dry-run documentation updates; add `--write` only when explicitly asked to modify BPMN files.
22. Use `bpmn-agent-cli implementation <file> --id <elementId> --kind <kind> --value "<value>"` for dry-run runtime implementation updates; add `--write` only when explicitly asked to modify BPMN files.
23. Use `bpmn-agent-cli format <file>` to dry-run BPMN XML formatting through moddle serialization; add `--write` only when explicitly asked to modify BPMN files.
24. Use `bpmn-agent-cli insert-task-between <file> --flow <flowId> --id <newElementId> --name "<name>"` to dry-run insertion of one task-like node into an existing sequence flow; note that P3-A does not update BPMNDI layout.
25. Use `bpmn-agent-cli connect <file> --from <sourceId> --to <targetId> --id <flowId>` to dry-run adding one sequence flow between existing nodes; note that P3-B does not update BPMNDI layout.
26. Use `bpmn-agent-cli delete-safe <file> --id <elementId>` to dry-run deletion of one safe linear flow node; note that P3-C does not generate replacement BPMNDI layout.
27. Use `bpmn-agent-cli add-boundary-event <file> --attached-to <activityId> --id <boundaryEventId> --target <targetId> --flow-id <flowId> --duration <duration>` to dry-run adding one timer boundary event; note that P3-D does not update BPMNDI layout.

Do not manually rewrite BPMN XML. Write commands are dry-run by default; add `--write` only when the user explicitly asks to modify BPMN files.

## Bundled CLI

When running from an installed Qwen extension command, invoke:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" overview process.bpmn
```

In a development checkout, use:

```bash
npm run start -- overview process.bpmn
```
