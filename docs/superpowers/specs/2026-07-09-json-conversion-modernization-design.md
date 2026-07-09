# JSON Conversion Modernization Design

## Goal

Keep `to-json` as a first-class JSON conversion feature while removing legacy positioning from product docs and active code architecture.

## Product Direction

`to-json` remains the command for full BPMN-to-JSON conversion. Focused read commands such as `overview`, `element`, `variables`, and `call-activity` answer targeted questions; `to-json` exports the full converted model for integrations, debugging, and workflows that need a complete JSON document.

The command keeps raw successful JSON output because the command output is the converted JSON document itself. Error output still uses the common error envelope.

## Architecture

Move converter implementation from `src/legacy` to `src/convert`. Move tests from `test/legacy` to `test/convert`. Keep public command name `to-json` and existing options:

```bash
bpmn-agent-cli to-json process.bpmn --preset optimized
bpmn-agent-cli to-json process.bpmn -o tmp/process.json
bpmn-agent-cli to-json --print-config optimized
```

No behavior change is required for the JSON shape in this step.

## Documentation

Active docs should not describe `to-json` as deprecated or legacy. Historical specs may keep historical wording, but README, CLI reference, output contracts, roadmap, backlog, AGENTS, and active tests should use “JSON conversion” terminology.

## Acceptance

- `to-json` still works with raw successful JSON output.
- `to-json --print-config` still works.
- Converter code lives under `src/convert`.
- Active docs describe JSON conversion as supported, not legacy.
- Backlog item BL-014 becomes `JSON Conversion Modernization` and is marked implemented.

