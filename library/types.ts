import { Vec3 } from "molstar/vec3";
import { MVSData, type Snapshot } from "molstar/mvs-data";
import { deflate, inflate, Zip } from "molstar/zip";
import { encodeMsgPack } from "molstar/msgpack-encode";
import { decodeMsgPack } from "molstar/msgpack-decode";
import { Task } from "molstar/task";

/**
 * MVSData type from Molstar for molecular visualization snapshots.
 * Re-exported for external use with story containers.
 *
 * @see {@link https://github.com/molstar/molstar/blob/master/src/extensions/mvs/mvs-data.ts}
 */
export { MVSData };

function adjustedCameraPosition(camera: CameraData) {
  // MVS uses FOV-adjusted camera position, need to apply inverse here so it doesn't offset the view when loaded
  const f =
    camera.mode === "orthographic"
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
  return new Function("builder", code);
};

async function getMVSData(
  story: Story,
  scenes: SceneData[] = story.scenes,
): Promise<MVSData | Uint8Array> {
  // Async in case of creating a ZIP archive with static assets

  const snapshots: Snapshot[] = [];

  // TODO: not sure if Promise.all would be better here.
  for (const scene of scenes) {
    const snapshot = await getMVSSnapshot(story, scene);
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
  const files: Record<string, Uint8Array> = {
    "index.mvsj": encoder.encode(JSON.stringify(index)),
  };
  for (const asset of story.assets) {
    files[asset.name] = asset.content;
  }

  const zip = await Zip(files).run();
  return new Uint8Array(zip);
}

async function getMVSSnapshot(story: Story, scene: SceneData) {
  try {
    const stateProvider = createStateProvider(`
async function _run_builder() {
      ${story.javascript}\n\n${scene.javascript}
}
return _run_builder();
`);
    const builder = MVSData.createBuilder();
    await stateProvider(builder);
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

/**
 * Container for a complete story with version information
 *
 * ## Structure Overview
 *
 * ```
 * StoryContainer {
 *   version: 1
 *   story: Story {
 *     metadata: StoryMetadata
 *     javascript: string
 *     scenes: SceneData[] {
 *       id: string
 *       header: string
 *       key: string
 *       description: string
 *       javascript: string
 *       camera?: CameraData
 *       linger_duration_ms?: number
 *       transition_duration_ms?: number
 *     }
 *     assets: SceneAsset[]
 *   }
 * }
 * ```
 *
 * ## Generated Output Structure
 *
 * When no assets: Returns MVSData JSON
 * When assets present: Returns Uint8Array (ZIP archive)
 *
 * ```
 * MVSData {
 *   kind: "multiple"
 *   metadata: { title, timestamp, version }
 *   snapshots: Snapshot[]
 * }
 * ```
 */
export class StoryContainer {
  /** Version of the story format */
  readonly version: 1 = 1;
  /** The story data */
  story: Story;

  /**
   * Creates a new StoryContainer instance
   * @param story The story data to contain
   */
  constructor(story: Story) {
    this.story = story;
  }

  /**
   * Generates MVSData for the story, including all scenes and assets
   * @returns Promise resolving to MVSData object or Uint8Array (if assets are present)
   */
  async generate(): Promise<MVSData | Uint8Array> {
    return await getMVSData(this.story);
  }

  /**
   * Generates a complete HTML page for viewing the story
   * @param options Optional configuration for the HTML output
   * @returns HTML string ready to be saved or served
   */
  async generateStoriesHtml(options?: {
    title?: string;
    molstarVersion?: string;
  }): Promise<string> {
    const data = await this.generate();
    const format = data instanceof Uint8Array ? "mvsx" : "mvsj";

    let state;

    if (data instanceof Uint8Array) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // state = `"base64,${(data as any).toBase64()}"`;
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
      state = `"base64,${base64}"`;
    } else {
      state = JSON.stringify(data);
    }

    const html = Template.replaceAll(
      "{{version}}",
      options?.molstarVersion ?? "5.0.0-dev.2",
    )
      .replace(
        "{{title}}",
        options?.title ?? this.story.metadata.title ?? "Untitled Story",
      )
      .replace("{{format}}", format)
      .replace("{{state}}", state);

    return html;
  }

  /**
   * Prepares session data for efficient storage and transmission
   * @returns Promise resolving to compressed Uint8Array containing the story data
   */
  private async prepareSessionData(): Promise<Uint8Array> {
    // Using message pack for efficient encoding - serialize the class instance directly
    const encoded = encodeMsgPack(this);
    const deflated = await Task.create("Deflate Story Data", async (ctx) => {
      return await deflate(ctx, encoded, { level: 3 });
    }).run();

    // Validate file size before proceeding
    this.validateDataSize(deflated);

    return deflated;
  }

  /**
   * Validates that the data size is within acceptable limits
   * @param data The data to validate
   * @throws Error if data exceeds size limits
   */
  private validateDataSize(data: Uint8Array): void {
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    if (data.length > maxSize) {
      throw new Error(
        `Data size ${data.length} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      );
    }
  }

  /**
   * Inflates (deserializes) binary story data back into a StoryContainer instance
   * @param data Compressed Uint8Array containing the story data
   * @returns Promise resolving to a StoryContainer instance
   */
  private static async inflate(data: Uint8Array): Promise<StoryContainer> {
    // Inflate the compressed data
    const inflated = await Task.create("Inflate Story Data", async (ctx) => {
      return await inflate(ctx, data);
    }).run();

    // Decode from MessagePack
    const decoded = decodeMsgPack(inflated) as { version: 1; story: Story };

    // Create new StoryContainer instance
    return new StoryContainer(decoded.story);
  }

  /**
   * Exports the story as an .mvstory file for download or storage
   *
   * This method creates a compressed binary file containing the complete story data
   * that can be saved to disk, transmitted, or stored for later use.
   *
   * @param filename The name for the exported file (extension optional)
   * @returns Promise resolving to an object with the file data and filename
   *
   * @example
   * ```typescript
   * const container = new StoryContainer(myStory);
   * const exported = await container.exportStory("my-molecular-story");
   *
   * // In browser environment - trigger download
   * const blob = new Blob([exported.data], { type: 'application/octet-stream' });
   * const url = URL.createObjectURL(blob);
   * const link = document.createElement('a');
   * link.href = url;
   * link.download = exported.filename;
   * link.click();
   *
   * // In Deno/Node - save to filesystem
   * await Deno.writeFile(exported.filename, exported.data);
   * ```
   *
   * @example
   * ```typescript
   * // The exported file can be loaded back later
   * const fileData = await Deno.readFile("my-story.mvstory");
   * const restoredContainer = await StoryContainer.importStory(fileData);
   * ```
   */
  async exportStory(
    filename: string,
  ): Promise<{ data: Uint8Array; filename: string }> {
    // Generate the story data using prepareSessionData (compressed binary format)
    const storyData = await this.prepareSessionData();

    // Ensure filename has .mvstory extension
    const exportFilename = filename.endsWith(".mvstory")
      ? filename
      : `${filename}.mvstory`;

    return {
      data: storyData,
      filename: exportFilename,
    };
  }

  /**
   * Imports a story from .mvstory file data
   *
   * This static method can be used to load a previously exported .mvstory file
   * back into a StoryContainer instance.
   *
   * @param data Binary data from an .mvstory file
   * @returns Promise resolving to a StoryContainer instance
   *
   * @example
   * ```typescript
   * // In Deno/Node - read from filesystem
   * const fileData = await Deno.readFile("my-story.mvstory");
   * const container = await StoryContainer.importStory(fileData);
   *
   * // In browser - from File input
   * const file = fileInput.files[0]; // File from <input type="file">
   * const arrayBuffer = await file.arrayBuffer();
   * const uint8Array = new Uint8Array(arrayBuffer);
   * const container = await StoryContainer.importStory(uint8Array);
   * ```
   */
  static async importStory(data: Uint8Array): Promise<StoryContainer> {
    return await this.inflate(data);
  }
}

/**
 * Complete story definition containing metadata, code, scenes, and assets
 */
export type Story = {
  /** Story metadata including title and other information */
  metadata: StoryMetadata;
  /** JavaScript code that applies to the entire story */
  javascript: string;
  /** Array of scenes that make up the story */
  scenes: SceneData[];
  /** Array of assets (files) used by the story */
  assets: SceneAsset[];
};

/**
 * Metadata information for a story
 */
export type StoryMetadata = {
  /** The title of the story */
  title: string;
};

/**
 * Represents a file asset used in the story (e.g., PDB files, images, etc.)
 */
export type SceneAsset = {
  /** Name/filename of the asset */
  name: string;
  /** Binary content of the asset file */
  content: Uint8Array;
};

/**
 * Complete data for a single scene in the story
 *
 * ## Structure Overview
 *
 * ```
 * SceneData {
 *   id: string
 *   header: string
 *   key: string
 *   description: string
 *   javascript: string
 *   camera?: CameraData {
 *     mode: "perspective" | "orthographic"
 *     target: [number, number, number]
 *     position: [number, number, number]
 *     up: [number, number, number]
 *     fov: number
 *   }
 *   linger_duration_ms?: number
 *   transition_duration_ms?: number
 * }
 * ```
 *
 * Similar to SnapshotMetadata in
 * https://github.com/molstar/molstar/blob/master/src/extensions/mvs/mvs-data.ts
 */
export type SceneData = {
  /** Unique identifier for the scene */
  id: string;
  /** Display header/title for the scene */
  header: string;
  /** Short key/identifier for the scene */
  key: string;
  /** Detailed description of the scene */
  description: string;
  /** JavaScript code specific to this scene */
  javascript: string;
  /** Camera configuration for this scene (optional) */
  camera?: CameraData | null;
  /** How long to stay on this scene in milliseconds (optional) */
  linger_duration_ms?: number;
  /** Duration of transition to this scene in milliseconds (optional) */
  transition_duration_ms?: number;
};

/**
 * Camera configuration for 3D scene viewing
 */
export type CameraData = {
  /** Camera projection mode */
  mode: "perspective" | "orthographic";
  /** Point the camera is looking at in 3D space */
  target: [number, number, number] | Vec3;
  /** Camera position in 3D space */
  position: [number, number, number] | Vec3;
  /** Camera up vector defining the orientation */
  up: [number, number, number] | Vec3;
  /** Field of view angle in degrees (for perspective mode) */
  fov: number;
};

const Template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{title}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        #viewer {
            position: absolute;
            left: 0;
            top: 0;
            right: 34%;
            bottom: 0;
        }

        #controls {
            position: absolute;
            left: 66%;
            top: 0;
            right: 0;
            bottom: 0;
            padding: 16px;
            padding-bottom: 20px;
            border: 1px solid #ccc;
            border-left: none;
            background: #F6F5F3;
            z-index: -2;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        @media (orientation:portrait) {
            #viewer {
                position: absolute;
                left: 0;
                top: 0;
                right: 0;
                bottom: 40%;
            }

            #controls {
                position: absolute;
                left: 0;
                top: 60%;
                right: 0;
                bottom: 0;
                border-top: none;
            }

            .msp-viewport-controls-buttons {
                display: none;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/molstar@{{version}}/build/mvs-stories/mvs-stories.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/molstar@{{version}}/build/mvs-stories/mvs-stories.css" />
</head>
<body>
    <div id="viewer">
        <mvs-stories-viewer></mvs-stories-viewer>
    </div>
    <div id="controls">
        <mvs-stories-snapshot-markdown style="flex-grow: 1;"></ mvs-stories-snapshot-markdown>
    </div>

    <script>
        var mvsData = {{state}};

        mvsStories.loadFromData(mvsData, { format: '{{format}}' });
    </script>
</body>
</html>`;
