# BPMN Agent CLI Extension

This extension provides `bpmn-agent-cli`, a local deterministic CLI for inspecting BPMN 2.0 files through small agent-friendly JSON queries.

Use the bundled CLI through:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" overview process.bpmn
```

Prefer the `bpmn-agent-cli` skill before reading raw `.bpmn` XML.

Use `diff --base before.bpmn --candidate after.bpmn` when comparing BPMN versions.
