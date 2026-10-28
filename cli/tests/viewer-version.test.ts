import { assertStringIncludes } from '@std/assert';
import { PLUGIN_VERSION } from 'molstar/lib/mol-plugin/version';
import {
  generateInlineStoriesHtml,
  generateMVSJViewerHtml,
  generateMVSXViewerHtml,
} from '../src/templates/mvs-viewer-template.ts';

Deno.test('preview viewers default to the installed Mol* version', () => {
  for (const generate of [generateMVSJViewerHtml, generateMVSXViewerHtml]) {
    const html = generate();
    assertStringIncludes(html, `molstar@${PLUGIN_VERSION}/build/mvs-stories/mvs-stories.js`);
    assertStringIncludes(html, `molstar@${PLUGIN_VERSION}/build/mvs-stories/mvs-stories.css`);
    assertStringIncludes(generate({ molstarVersion: '5.13.0' }), 'molstar@5.13.0/');
  }
});

Deno.test('inline viewers share the same installed-version default and explicit override', () => {
  for (const data of [{ kind: 'multiple', snapshots: [] }, new Uint8Array([1, 2, 3])]) {
    assertStringIncludes(generateInlineStoriesHtml(data), `molstar@${PLUGIN_VERSION}/`);
    assertStringIncludes(generateInlineStoriesHtml(data, { molstarVersion: '5.13.0' }), 'molstar@5.13.0/');
  }
});
