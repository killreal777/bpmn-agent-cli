import type { ExportResult } from '../query/exportModel.js';

export function renderText(model: ExportResult): string {
  const lines = ['BPMN Export', ''];

  if (model.overview) {
    lines.push('OVERVIEW', `Definitions: ${model.overview.definitions.id ?? '(none)'}`);
    for (const process of model.overview.processes) {
      lines.push(`Process ${process.id}: ${process.name ?? '(unnamed)'}; nodes ${process.flowNodes}; flows ${process.sequenceFlows}`);
    }
    lines.push('');
  }

  if (model.participants) {
    lines.push('PARTICIPANTS');
    for (const collaboration of model.participants.collaborations) {
      lines.push(`Collaboration ${collaboration.id}: ${collaboration.name ?? '(unnamed)'}`);
      for (const participant of collaboration.participants) {
        lines.push(`Participant ${participant.id}: ${participant.name ?? '(unnamed)'} -> ${participant.processId ?? '(no process)'}`);
      }
    }
    lines.push('');
  }

  if (model.lanes) {
    lines.push('LANES');
    for (const lane of model.lanes.lanes) {
      lines.push(`Lane ${lane.id}: ${lane.flowNodes.map((node) => node.id).join(', ') || '(empty)'}`);
    }
    lines.push('');
  }

  if (model.events) {
    lines.push('EVENTS');
    for (const event of model.events.events) {
      lines.push(`Event ${event.id}: ${event.category}`);
    }
    lines.push('');
  }

  if (model.subprocess) {
    lines.push('SUBPROCESSES');
    for (const subprocess of model.subprocess.subprocesses) {
      lines.push(`Subprocess ${subprocess.element.id}: children ${subprocess.children.map((child) => child.id).join(', ') || '(none)'}`);
    }
    lines.push('');
  }

  if (model.implementations) {
    lines.push('IMPLEMENTATIONS');
    for (const implementation of [
      ...model.implementations.serviceTasks,
      ...model.implementations.callActivities,
      ...model.implementations.listeners,
      ...model.implementations.forms
    ]) {
      lines.push(`${implementation.elementId}: ${implementation.kind}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
