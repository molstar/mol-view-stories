import { MVSData, type Snapshot } from "molstar/lib/extensions/mvs/mvs-data.js";
import { Mat3, Mat4, Quat, Vec3 } from "molstar/lib/mol-math/linear-algebra.js";
import { Euler } from "molstar/lib/mol-math/linear-algebra/3d/euler.js";
import { Zip } from "molstar/lib/mol-util/zip/zip.js";
import { decodeMsgPack } from "molstar/lib/mol-io/common/msgpack/decode.js";
import { encodeMsgPack } from "molstar/lib/mol-io/common/msgpack/encode.js";
import { deflate, inflate } from "molstar/lib/mol-util/zip/zip";
import { decodeColor } from "molstar/lib/mol-util/color/utils";
import { PLUGIN_VERSION } from "molstar/lib/mol-plugin/version";
import type { CameraData, SceneData, Story, StoryContainer } from "./types.ts";
import { Task } from "molstar/lib/mol-task";
import { generateStoriesHtml } from "./html-template.ts";
import { MolScriptBuilder } from "molstar/lib/mol-script/language/builder.js";
import { formatMolScript } from "molstar/lib/mol-script/language/expression-formatter.js";

export const StoryFileExtension = ".mvstory";

const BuilderLib = {
  Vec3,
  Mat3,
  Mat4,
  Quat,
  Euler,
  decodeColor,
  MolScriptBuilder,
  formatMolScript,
};

export const BuilderLibNamespaces: string[] = Object.keys(BuilderLib);

export function adjustedCameraPosition(
  camera: CameraData,
): [number, number, number] {
  // MVS uses FOV-adjusted camera position, need to apply inverse here so it doesn't offset the view when loaded
  const f = camera.mode === "orthographic"
    ? 1 / (2 * Math.tan(camera.fov / 2))
    : 1 / (2 * Math.sin(camera.fov / 2));
  const delta = Vec3.sub(
    Vec3(),
    camera.position as Vec3,
    camera.target as Vec3,
  );
  return Vec3.scaleAndAdd(
    Vec3(),
    camera.target as Vec3,
    delta,
    1 / f,
  ) as unknown as [number, number, number];
}

const createStateProvider = (code: string) => {
  return new Function("builder", "index", "__lib__", code);
};

async function getMVSSnapshot(story: Story, scene: SceneData, index: number) {
  try {
    const stateProvider = createStateProvider(`
const { ${Object.keys(BuilderLib).join(", ")} } = __lib__;
async function _run_builder() {
      ${story.javascript}\n\n${scene.javascript}
}
return _run_builder();
`);
    const builder = MVSData.createBuilder();
    await stateProvider(builder, index, BuilderLib);
    if (scene.camera) {
      builder.camera({
        position: adjustedCameraPosition(scene.camera),
        target: scene.camera.target as unknown as [number, number, number],
        up: scene.camera.up as unknown as [number, number, number],
      });
    }
    const snapshot = builder.getSnapshot({
      key: scene.key.trim() || undefined,
      title: scene.header,
      description: scene.description,
      linger_duration_ms: scene.linger_duration_ms || 5000,
      transition_duration_ms: scene.transition_duration_ms || 500,
    });

    return snapshot;
  } catch (error) {
    console.error("Error creating state provider:", error);
    throw error;
  }
}

export async function getMVSData(
  story: Story,
  scenes: SceneData[] = story.scenes,
): Promise<MVSData | Uint8Array> {
  // Async in case of creating a ZIP archite with static assets

  const snapshots: Snapshot[] = [];

  // TODO: not sure if Promise.all would be better here.
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    const snapshot = await getMVSSnapshot(story, scene, index);
    snapshots.push(snapshot);
  }
  const index: MVSData = {
    kind: "multiple",
    metadata: {
      title: story.metadata.title,
      timestamp: new Date().toISOString(),
      version: `${MVSData.SupportedVersion}`,
    },
    snapshots,
  };

  if (!story.assets.length) {
    return index;
  }

  const encoder = new TextEncoder();
  const files: Record<string, Uint8Array<ArrayBuffer>> = {
    "index.mvsj": encoder.encode(JSON.stringify(index)) as Uint8Array<
      ArrayBuffer
    >,
  };
  for (const asset of story.assets) {
    files[asset.name] = asset.content as Uint8Array<ArrayBuffer>;
  }

  const zip = await Zip(files).run();
  return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}

export async function readStoryContainer(bytes: Uint8Array): Promise<Story> {
  const inflated = await Task.create("Inflate Story Data", async (ctx) => {
    return await inflate(
      ctx,
      new Uint8Array(
        bytes.buffer as ArrayBuffer,
        bytes.byteOffset,
        bytes.byteLength,
      ),
    );
  }).run();

  const decoded = decodeMsgPack(
    new Uint8Array(
      inflated.buffer as ArrayBuffer,
      inflated.byteOffset,
      inflated.byteLength,
    ),
  ) as StoryContainer;
  if (decoded.version !== 1) {
    throw new Error(
      `Unsupported story version: ${decoded.version}. Expected version 1.`,
    );
  }
  return decoded.story;
}

export async function createCompressedStoryContainer(
  story: Story,
): Promise<Uint8Array> {
  const container: StoryContainer = {
    version: 1,
    story,
  };
  // Using message pack for:
  // - More efficient
  // - Ability to encode Uint8Array for file assets directly
  const encoded = encodeMsgPack(container);
  const deflated = await Task.create("Deflate Story Data", async (ctx) => {
    return await deflate(ctx, encoded, { level: 3 });
  }).run();
  return new Uint8Array(deflated);
}

const codeCache = new Map<string, Promise<Uint8Array>>();

async function downloadStoriesCode(
  version: string,
  asset: "js" | "css",
): Promise<Uint8Array> {
  const cacheKey = `${version}:${asset}`;
  if (codeCache.has(cacheKey)) {
    return codeCache.get(cacheKey)!;
  }

  try {
    const req = fetch(
      `https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.${asset}`,
    );

    const response = await req;
    if (!response.ok) {
      codeCache.delete(cacheKey);
      throw new Error(`Failed to download MolStar version ${version}`);
    }

    const data = await response.arrayBuffer();
    const uint8Array = new Uint8Array(data);
    codeCache.set(cacheKey, Promise.resolve(uint8Array));
    return uint8Array;
  } catch (error) {
    codeCache.delete(cacheKey);
    throw error;
  }
}

/**
 * Creates a zip file containing the story and its assets for self-hosting purposes
 */
export async function createSelfHostedZip(
  story: Story,
  options?: { molstarVersion?: string },
): Promise<Uint8Array> {
  const version = options?.molstarVersion || PLUGIN_VERSION;

  const [js, css, data, session] = await Promise.all([
    downloadStoriesCode(version, "js"),
    downloadStoriesCode(version, "css"),
    getMVSData(story),
    createCompressedStoryContainer(story),
  ]);

  const format = data instanceof Uint8Array ? "mvsx" : "mvsj";

  const dataPath = `story/data.${data instanceof Uint8Array ? "mvsx" : "mvsj"}`;
  const sessionPath = `story/session${StoryFileExtension}`;

  const html = generateStoriesHtml(
    { kind: "self-hosted", dataPath, sessionPath, format },
    {
      title: story.metadata.title,
      jsPath: "assets/mvs-stories.js",
      cssPath: "assets/mvs-stories.css",
    },
  );

  const encoder = new TextEncoder();
  const encodedData = data instanceof Uint8Array
    ? data
    : encoder.encode(JSON.stringify(data));

  const files: Record<string, Uint8Array<ArrayBuffer>> = {
    "assets/mvs-stories.js": js as Uint8Array<ArrayBuffer>,
    "assets/mvs-stories.css": css as Uint8Array<ArrayBuffer>,
    [dataPath]: encodedData as Uint8Array<ArrayBuffer>,
    [sessionPath]: session as Uint8Array<ArrayBuffer>,
    "index.html": encoder.encode(html) as Uint8Array<ArrayBuffer>,
  };

  const zip = await Zip(files).run();
  return new Uint8Array(zip) as Uint8Array<ArrayBuffer>;
}
