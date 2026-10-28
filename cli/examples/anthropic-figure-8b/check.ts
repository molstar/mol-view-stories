/** Build every panel, validate MVS, and check all structure references are bundled. */
import { assert, assertEquals } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { parseStoryFolder } from '../../src/commands/build.ts';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import { getMVSData } from '@mol-view-stories/lib/utils.ts';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data.js';

const root = dirname(fromFileUrl(import.meta.url));
const output = join(root, '.build');
await Deno.mkdir(output, { recursive: true });
for (const [name, count] of [['00-comparison', 2], ['01-crossmab', 4], ['02-2plus1', 4], ['03-igg-scfv', 4]] as const) {
  const story = await parseStoryFolder(join(root, name));
  assertEquals(story.scenes.length, count);
  const data = await getMVSData({ ...story, assets: [] });
  assert(!(data instanceof Uint8Array));
  assertEquals(MVSData.validationIssues(data, { noExtra: true }), undefined);
  const references = new Set<string>();
  let structures = 0, instances = 0, surfaces = 0;
  function walk(node: any) {
    if (node.kind === 'structure') structures++;
    if (node.kind === 'instance') instances++;
    if (node.kind === 'representation' && node.params.type === 'surface') {
      surfaces++;
      assertEquals(node.params.surface_type, 'gaussian');
    }
    if (node.kind === 'download') references.add(node.params.url);
    for (const child of node.children ?? []) walk(child);
  }
  assert(data.kind === 'multiple');
  for (const snapshot of data.snapshots) walk(snapshot.root);
  if (name === '00-comparison') {
    // Each comparison keeps all 36 placements but only builds 9 styled templates
    // (the CrossMab arm has its own domain colors); surfaces are one per colored domain group.
    assertEquals(structures, count * 9);
    assertEquals(instances, count * 36);
    assertEquals(surfaces, count * 22);
  }
  for (const url of references) {
    assert(url.startsWith('./') && !url.slice(2).includes('/'), `Non-local reference: ${url}`);
    const asset = story.assets.find(a => a.name === url.slice(2));
    assert(asset && asset.content.length > 1000, `Missing/empty bundled structure: ${url}`);
  }
  const manager = new StoryManager(story);
  const mvsx = await manager.toMVS();
  assert(mvsx instanceof Uint8Array);
  await Deno.writeFile(join(output, name + '.mvsx'), mvsx);
  await Deno.writeFile(join(output, name + '.mvstory'), await manager.toMVStory());
  console.error(`PASS ${name}: ${count} snapshots, ${references.size} bundled templates; ${structures} structures / ${instances} instances / ${surfaces} surfaces; MVS schema valid`);
}
console.error(`Artifacts: ${output}`);
