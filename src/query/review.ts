import type { Diagnostic, LoadedBpmnModel } from '../bpmn/types.js';
import { buildIndexes } from '../index/buildIndexes.js';
import { validateModel, type ValidateResult } from '../validate/validateModel.js';
import { getEvents, type EventsResult } from './events.js';
import { listImplementations, type ImplementationsResult } from './implementations.js';
import { getLanes, type LanesResult } from './lanes.js';
import { getOverview, type OverviewResult } from './overview.js';
import { getParticipants, type ParticipantsResult } from './participants.js';
import { getSubprocesses, type SubprocessResult } from './subprocess.js';

export type ReviewChecklistItem = {
  id: string;
  text: string;
  relatedCodes: string[];
};

export type ReviewResult = {
  file: string;
  overview: OverviewResult;
  diagnostics: ValidateResult;
  participants: ParticipantsResult;
  lanes: LanesResult;
  events: EventsResult;
  subprocess: SubprocessResult;
  implementations: ImplementationsResult;
  riskFlags: Diagnostic[];
  checklist: ReviewChecklistItem[];
};

export function buildReviewPacket(model: LoadedBpmnModel): ReviewResult {
  const indexes = buildIndexes(model);
  const diagnostics = validateModel(model, indexes);
  const overview = getOverview(model, indexes);
  const participants = getParticipants(model, indexes);
  const lanes = getLanes(indexes, {});
  const events = getEvents(model, indexes, {});
  const subprocess = getSubprocesses(indexes, {});
  const implementations = listImplementations(indexes, {});
  const riskFlags = [...diagnostics.errors, ...diagnostics.warnings].sort(compareDiagnostics);

  return {
    file: model.filePath,
    overview,
    diagnostics,
    participants,
    lanes,
    events,
    subprocess,
    implementations,
    riskFlags,
    checklist: buildChecklist({
      diagnostics,
      overview,
      participants,
      lanes,
      events,
      subprocess,
      implementations,
      riskFlags
    })
  };
}

function buildChecklist(args: {
  diagnostics: ValidateResult;
  overview: OverviewResult;
  participants: ParticipantsResult;
  lanes: LanesResult;
  events: EventsResult;
  subprocess: SubprocessResult;
  implementations: ImplementationsResult;
  riskFlags: Diagnostic[];
}): ReviewChecklistItem[] {
  const items: ReviewChecklistItem[] = [];
  const riskCodes = [...new Set(args.riskFlags.map((diagnostic) => diagnostic.code))].sort((a, b) => a.localeCompare(b));

  if (args.riskFlags.length > 0) {
    items.push({
      id: 'review-diagnostics',
      text: 'Review validation errors and warnings before approving this BPMN.',
      relatedCodes: riskCodes
    });
  }

  if (Object.keys(args.overview.counts.gateways).length > 0) {
    items.push({
      id: 'review-gateways',
      text: 'Review gateway branches and sequence-flow conditions.',
      relatedCodes: riskCodes.filter((code) => code.includes('GATEWAY'))
    });
  }

  if (
    args.implementations.serviceTasks.length > 0
    || args.implementations.callActivities.length > 0
    || args.implementations.listeners.length > 0
    || args.implementations.forms.length > 0
  ) {
    items.push({
      id: 'review-implementations',
      text: 'Review runtime implementations, delegates, forms, listeners, and external task topics.',
      relatedCodes: riskCodes.filter((code) => code.includes('IMPLEMENTATION') || code.includes('EXTERNAL_TASK'))
    });
  }

  if (args.events.events.length > 0) {
    items.push({
      id: 'review-events',
      text: 'Review start/end/boundary/intermediate events and handler flows.',
      relatedCodes: riskCodes.filter((code) => code.includes('BOUNDARY') || code.includes('EVENT'))
    });
  }

  if (args.implementations.callActivities.length > 0 || riskCodes.some((code) => code.includes('CALL_ACTIVITY'))) {
    items.push({
      id: 'review-call-activities',
      text: 'Review CallActivity called elements and variable mappings.',
      relatedCodes: riskCodes.filter((code) => code.includes('CALL_ACTIVITY'))
    });
  }

  if (args.participants.collaborations.length > 0 || args.lanes.lanes.length > 0) {
    items.push({
      id: 'review-collaboration',
      text: 'Review participant, lane, and message-flow ownership.',
      relatedCodes: []
    });
  }

  if (args.subprocess.subprocesses.length > 0) {
    items.push({
      id: 'review-subprocesses',
      text: 'Review subprocess boundaries, direct children, and nested subprocesses.',
      relatedCodes: []
    });
  }

  return items.sort((a, b) => a.id.localeCompare(b.id));
}

function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  return severityRank(a.severity) - severityRank(b.severity)
    || (a.elementId ?? '').localeCompare(b.elementId ?? '')
    || a.code.localeCompare(b.code);
}

function severityRank(severity: Diagnostic['severity']): number {
  if (severity === 'error') {
    return 0;
  }
  if (severity === 'warning') {
    return 1;
  }
  return 2;
}
