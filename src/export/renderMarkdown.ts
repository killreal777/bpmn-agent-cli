import type { ExportResult } from '../query/exportModel.js';

export function renderMarkdown(model: ExportResult): string {
  const lines = ['# BPMN Export', ''];

  if (model.overview) {
    lines.push('## Overview', '', `- Definitions: ${model.overview.definitions.id ?? '(none)'}`);
    for (const process of model.overview.processes) {
      lines.push(`- Process ${process.id}: ${process.name ?? '(unnamed)'}; nodes ${process.flowNodes}; flows ${process.sequenceFlows}`);
    }
    lines.push('');
  }

  if (model.participants) {
    lines.push('## Participants', '');
    for (const collaboration of model.participants.collaborations) {
      lines.push(`- Collaboration ${collaboration.id}: ${collaboration.name ?? '(unnamed)'}`);
      for (const participant of collaboration.participants) {
        lines.push(`  - Participant ${participant.id}: ${participant.name ?? '(unnamed)'} -> ${participant.processId ?? '(no process)'}`);
      }
      for (const flow of collaboration.messageFlows) {
        lines.push(`  - MessageFlow ${flow.id}: ${flow.sourceId ?? '?'} -> ${flow.targetId ?? '?'}`);
      }
    }
    lines.push('');
  }

  if (model.lanes) {
    lines.push('## Lanes', '');
    for (const lane of model.lanes.lanes) {
      lines.push(`- Lane ${lane.id}: ${lane.name ?? '(unnamed)'}; nodes ${lane.flowNodes.map((node) => node.id).join(', ') || '(empty)'}`);
    }
    lines.push('');
  }

  if (model.events) {
    lines.push('## Events', '');
    for (const event of model.events.events) {
      const definitions = event.eventDefinitions.map((definition) => definition.value ?? definition.refId ?? definition.type).join(', ');
      lines.push(`- Event ${event.id}: ${event.category}; ${definitions || 'no definition'}`);
    }
    lines.push('');
  }

  if (model.subprocess) {
    lines.push('## Subprocesses', '');
    for (const subprocess of model.subprocess.subprocesses) {
      lines.push(`- Subprocess ${subprocess.element.id}: children ${subprocess.children.map((child) => child.id).join(', ') || '(none)'}`);
    }
    lines.push('');
  }

  if (model.implementations) {
    lines.push('## Implementations', '');
    const implementations = [
      ...model.implementations.serviceTasks,
      ...model.implementations.callActivities,
      ...model.implementations.listeners,
      ...model.implementations.forms
    ];
    for (const implementation of implementations) {
      lines.push(`- ${implementation.elementId}: ${implementation.kind}${implementation.value ? ` ${implementation.value}` : ''}${implementation.topic ? ` topic=${implementation.topic}` : ''}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
