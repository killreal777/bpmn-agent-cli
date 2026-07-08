import type { LoadedBpmnModel } from '../bpmn/types.js';
import { buildIndexes } from '../index/buildIndexes.js';
import { getEvents, type EventsResult } from './events.js';
import { listImplementations, type ImplementationsResult } from './implementations.js';
import { getLanes, type LanesResult } from './lanes.js';
import { getOverview, type OverviewResult } from './overview.js';
import { getParticipants, type ParticipantsResult } from './participants.js';
import { getSubprocesses, type SubprocessResult } from './subprocess.js';

export const EXPORT_SECTIONS = ['overview', 'participants', 'lanes', 'events', 'subprocess', 'implementations'] as const;

export type ExportSection = typeof EXPORT_SECTIONS[number];

export type ExportResult = {
  format: 'json';
  sections: ExportSection[];
  overview?: OverviewResult;
  participants?: ParticipantsResult;
  lanes?: LanesResult;
  events?: EventsResult;
  subprocess?: SubprocessResult;
  implementations?: ImplementationsResult;
};

export function buildExportModel(model: LoadedBpmnModel, sections: ExportSection[]): ExportResult {
  const indexes = buildIndexes(model);
  const result: ExportResult = {
    format: 'json',
    sections: [...sections]
  };

  for (const section of sections) {
    if (section === 'overview') {
      result.overview = getOverview(model, indexes);
    } else if (section === 'participants') {
      result.participants = getParticipants(model, indexes);
    } else if (section === 'lanes') {
      result.lanes = getLanes(indexes, {});
    } else if (section === 'events') {
      result.events = getEvents(model, indexes, {});
    } else if (section === 'subprocess') {
      result.subprocess = getSubprocesses(indexes, {});
    } else if (section === 'implementations') {
      result.implementations = listImplementations(indexes, {});
    }
  }

  return result;
}
