import { createBpmnModdle } from '../bpmn/moddle.js';
import type { LoadedBpmnModel } from '../bpmn/types.js';

export type FormatResult = {
  dryRun: boolean;
  written: boolean;
  file: string;
  outputFile: string | null;
  changed: boolean;
  before: {
    bytes: number;
  };
  after: {
    bytes: number;
  };
  diagnostics: {
    warnings: Array<{ message: string }>;
  };
};

export type FormatBpmnArgs = {
  model: LoadedBpmnModel;
  file: string;
  outputFile?: string | null;
  dryRun?: boolean;
  written?: boolean;
};

export type FormatBpmnPlan = {
  xml: string;
  result: FormatResult;
};

export async function formatBpmnModel(args: FormatBpmnArgs): Promise<FormatBpmnPlan> {
  const { xml } = await createBpmnModdle().toXML(args.model.definitions, { format: true });
  const formatted = xml.endsWith('\n') ? xml : `${xml}\n`;

  return {
    xml: formatted,
    result: {
      dryRun: args.dryRun ?? true,
      written: args.written ?? false,
      file: args.file,
      outputFile: args.outputFile ?? null,
      changed: formatted !== args.model.xml,
      before: {
        bytes: Buffer.byteLength(args.model.xml, 'utf8')
      },
      after: {
        bytes: Buffer.byteLength(formatted, 'utf8')
      },
      diagnostics: {
        warnings: args.model.warnings
      }
    }
  };
}
