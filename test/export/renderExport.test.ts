import { describe, expect, it } from 'vitest';
import { loadBpmn } from '../../src/bpmn/loadBpmn.js';
import { renderMarkdown } from '../../src/export/renderMarkdown.js';
import { renderText } from '../../src/export/renderText.js';
import { buildExportModel } from '../../src/query/exportModel.js';
import { fixturePath } from '../../src/testing/fixtures.js';

describe('export renderers', () => {
  it('renders markdown without raw XML', async () => {
    const model = await loadBpmn(fixturePath('boundary-timer.bpmn'));
    const markdown = renderMarkdown(buildExportModel(model, ['overview', 'events']));

    expect(markdown).toContain('# BPMN Export');
    expect(markdown).toContain('## Events');
    expect(markdown).toContain('Boundary_Timer');
    expect(markdown).not.toContain('<bpmn:');
  });

  it('renders text without raw XML', async () => {
    const model = await loadBpmn(fixturePath('simple-linear.bpmn'));
    const text = renderText(buildExportModel(model, ['overview']));

    expect(text).toContain('BPMN Export');
    expect(text).toContain('OVERVIEW');
    expect(text).toContain('Definitions_SimpleLinear');
    expect(text).not.toContain('<bpmn:');
  });
});
