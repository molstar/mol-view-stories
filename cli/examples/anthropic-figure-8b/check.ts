/** Build the story, validate every snapshot, and check that repeated molecules stay instanced. */
import { assert, assertEquals } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { parseStoryFolder } from '../../src/commands/build.ts';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import { getMVSData } from '@mol-view-stories/lib/utils.ts';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data.js';

const root = dirname(fromFileUrl(import.meta.url));
const story = await parseStoryFolder(root);
const data = await getMVSData({ ...story, assets: [] });
assert(!(data instanceof Uint8Array) && data.kind === 'multiple');
assertEquals(MVSData.validationIssues(data, { noExtra: true }), undefined);

for (const snapshot of data.snapshots) {
  let structures = 0;
  const walk = (node: any) => {
    if (node.kind === 'structure') structures++;
    if (node.kind === 'download') {
      const name = node.params.url.replace(/^\.\//, '');
      assert(story.assets.some(a => a.name === name && a.content.length > 1000), `Missing bundled structure: ${name}`);
    }
    node.children?.forEach(walk);
  };
  walk(snapshot.root);
  // One structure per styled template (9 in the comparison); a regression to one per copy would be 36.
  assert(structures <= 9, `${snapshot.metadata?.key}: ${structures} structures; repeated molecules should be instances`);
}

const output = join(root, '.build');
await Deno.mkdir(output, { recursive: true });
const manager = new StoryManager(story);
const mvsx = await manager.toMVS();
assert(mvsx instanceof Uint8Array);
await Deno.writeFile(join(output, 'figure-8b.mvsx'), mvsx);
await Deno.writeFile(join(output, 'figure-8b.mvstory'), await manager.toMVStory());
console.error(`PASS: ${data.snapshots.length} snapshots, ${story.assets.length} bundled structures, MVS schema valid; built .mvsx and .mvstory in ${output}`);
