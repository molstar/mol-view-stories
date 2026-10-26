import { assertEquals, assertRejects } from '@std/assert';
import { getMVSData } from '@mol-view-stories/lib/utils.ts';
import type { Story } from '@mol-view-stories/lib/types';
import { Script } from 'molstar/lib/mol-script/script.js';

const pymolText = 'chain A and resi 248-256';
const molScriptText = `(sel.atom.atom-groups
  :chain-test (= atom.auth_asym_id A)
  :residue-test (in-range atom.auth_seq_id 248 256))`;

function story(javascript: string, sceneJavaScript: string): Story {
  return {
    metadata: { title: 'Selection helpers' },
    javascript,
    assets: [],
    scenes: [
      {
        id: 'selection',
        header: 'Selection',
        key: '',
        description: '',
        javascript: sceneJavaScript,
      },
    ],
  };
}

Deno.test('story scripts eagerly compile selection helpers in shared and scene code', async () => {
  const selections: [string, Script.Language][] = [
    [pymolText, 'pymol'],
    [molScriptText, 'mol-script'],
    ['chain A', 'vmd'],
    [':A', 'jmol'],
  ];
  const data = await getMVSData(
    story(
      `const sharedSelector = pymol(${JSON.stringify(pymolText)});`,
      `const structure = builder.download({ url: 'test.bcif' }).parse({ format: 'bcif' }).modelStructure();
     structure.component({ selector: sharedSelector });
     structure.component({ selector: molql(${JSON.stringify(pymolText)}) });
     ${selections
       .map(
         ([text, language]) =>
           `structure.component({ selector: molql(${JSON.stringify(text)}, ${JSON.stringify(language)}) });`
       )
       .join('\n')}`
    )
  );

  // Inspect the exported JSON: selectors must already contain expressions, with no parsing left for the viewer.
  const exported = JSON.parse(JSON.stringify(data));
  const components = exported.snapshots[0].root.children[0].children[0].children[0].children;
  const expected = selections.map(([text, language]) => ({
    molql: JSON.parse(JSON.stringify(Script.toExpression(Script(text, language)))),
  }));
  assertEquals(
    components.map((node: { params: { selector: unknown } }) => node.params.selector),
    [expected[0], expected[0], ...expected]
  );
});

Deno.test('selection helpers reject invalid text immediately, even without adding a component', async () => {
  for (const helper of ['molql', 'pymol']) {
    await assertRejects(
      () => getMVSData(story('', `${helper}('this is (not a selection');`)),
      Error,
      `${helper}("this is (not a selection") is not a`
    );
  }
});
