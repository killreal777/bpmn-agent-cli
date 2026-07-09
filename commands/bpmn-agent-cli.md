---
description: Run the bundled BPMN Agent CLI against BPMN files.
argument-hint: "<command> [file] [options]"
---

Run BPMN Agent CLI from the installed extension directory:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" $ARGUMENTS
```

Bundled CLI path: `dist/extension/bpmn-agent-cli.cjs`.

Examples:

```bash
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" overview process.bpmn --pretty
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" find process.bpmn --query "approve"
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" call-activity process.bpmn --id Call_SubProcess
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" diff --base before.bpmn --candidate after.bpmn
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" impact process.bpmn --id Task_1
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" review process.bpmn
node "${extensionPath}${/}dist${/}extension${/}bpmn-agent-cli.cjs" validate process.bpmn
```
