import { Story, SceneData, SceneAsset, StoryContainer } from './types.ts';
import { UUID } from 'molstar/lib/mol-util/uuid.js';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data.js';
import { Task } from 'molstar/lib/mol-task/index.js';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode.js';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode.js';
import { deflate, inflate } from 'molstar/lib/mol-util/zip/zip.js';
import { generateStoriesHtml } from './html-template.ts';
import * as utils from './utils.ts';

/**
 * StoryManager - Complete story management and export/import system
 *
 * This class provides a comprehensive interface for managing Story objects, including
 * creation, modification, and persistence operations. It handles all CRUD operations
 * on stories, scenes, and assets, while providing multiple export formats including
 * JSON, compressed containers (.mvstory), MVS data for Mol* viewer integration,
 * standalone HTML files, and self-hosted zip packages.
 *
 * The manager also supports importing stories from various formats and provides
 * utilities for scene reordering, metadata management, and asset handling. It serves
 * as the primary interface between the application and the underlying story data
 * structure, ensuring data integrity and providing format conversions.
 */
export class StoryManager {
  private story: Story;

  constructor(story?: Story) {
    this.story = story || StoryManager.createEmptyStory();
  }

  // --- Core Operations ---

  getStory(): Story {
    return this.story;
  }

  setStory(story: Story): void {
    this.story = story;
  }

  clone(): StoryManager {
    // Deep clone the story
    return new StoryManager(JSON.parse(JSON.stringify(this.story)));
  }

  // --- Metadata Operations ---

  updateMetadata(updates: Partial<Story['metadata']>): void {
    this.story.metadata = { ...this.story.metadata, ...updates };
  }

  setGlobalJavascript(code: string): void {
    this.story.javascript = code;
  }

  // --- Scene Operations ---

  addScene(scene?: Partial<SceneData>): string {
    const id = UUID.createv4();
    const newScene: SceneData = {
      id,
      header: scene?.header || 'New Scene',
      key: scene?.key || '',
      description: scene?.description || '',
      javascript: scene?.javascript || '',
      camera: scene?.camera || null,
      linger_duration_ms: scene?.linger_duration_ms,
      transition_duration_ms: scene?.transition_duration_ms,
    };

    this.story.scenes.push(newScene);
    return id;
  }

  updateScene(id: string, updates: Partial<Omit<SceneData, 'id'>>): boolean {
    const index = this.story.scenes.findIndex((s: SceneData) => s.id === id);
    if (index === -1) return false;

    this.story.scenes[index] = { ...this.story.scenes[index], ...updates };
    return true;
  }

  removeScene(id: string): boolean {
    if (this.story.scenes.length <= 1) {
      throw new Error('Cannot remove the last scene');
    }

    const index = this.story.scenes.findIndex((s: SceneData) => s.id === id);
    if (index === -1) return false;

    this.story.scenes.splice(index, 1);
    return true;
  }

  reorderScene(id: string, newIndex: number): boolean {
    const currentIndex = this.story.scenes.findIndex((s: SceneData) => s.id === id);
    if (currentIndex === -1) return false;
    if (newIndex < 0 || newIndex >= this.story.scenes.length) return false;

    const [scene] = this.story.scenes.splice(currentIndex, 1);
    this.story.scenes.splice(newIndex, 0, scene);
    return true;
  }

  getScene(id: string): SceneData | undefined {
    return this.story.scenes.find((s: SceneData) => s.id === id);
  }

  // --- Asset Operations ---

  addAsset(asset: SceneAsset): void {
    // Replace if exists
    this.story.assets = this.story.assets.filter((a: SceneAsset) => a.name !== asset.name);
    this.story.assets.push(asset);
  }

  removeAsset(name: string): boolean {
    const index = this.story.assets.findIndex((a: SceneAsset) => a.name === name);
    if (index === -1) return false;

    this.story.assets.splice(index, 1);
    return true;
  }

  getAsset(name: string): SceneAsset | undefined {
    return this.story.assets.find((a: SceneAsset) => a.name === name);
  }

  // --- Export Operations ---

  /**
   * Export story as human-readable JSON string.
   * @returns JSON string representation of the Story object
   */
  toJSON(): string {
    return JSON.stringify(this.story, null, 2);
  }

  /**
   * Export story as compressed MVStory container (.mvstory file).
   *
   * This is the canonical storage format for stories, using:
   * - MessagePack encoding for efficient binary serialization
   * - Deflate compression for reduced file size
   *
   * The .mvstory format is:
   * - Editable: Can be loaded back into the Story Builder for editing
   * - Compact: Compressed for efficient storage and transmission
   * - Complete: Contains all JavaScript code, scenes, and assets
   *
   * Use this for:
   * - Saving stories in the webapp or CLI
   * - API storage (session files)
   * - Sharing editable stories with collaborators
   *
   * @returns Promise resolving to compressed MVStory container bytes
   */
  async toMVStory(): Promise<Uint8Array> {
    const container: StoryContainer = {
      version: 1,
      story: this.story,
    };

    const encoded = encodeMsgPack(container);
    const deflated = await Task.create('Deflate Story Data', async (ctx) => {
      return await deflate(ctx, encoded, { level: 3 });
    }).run();

    return new Uint8Array(deflated);
  }

  /**
   * Export story as MVS data for Mol* viewer (.mvsj or .mvsx files).
   *
   * MVS (Molecular Visualization State) is Molstar's native format containing:
   * - Executed state with plugin commands
   * - Camera positions and representations
   * - No JavaScript code (already executed)
   *
   * Output formats:
   * - .mvsj: JSON format (if no assets)
   * - .mvsx: ZIP format (if story contains assets)
   *
   * Use this for:
   * - Viewing in the Mol* viewer (molstar.org)
   * - Read-only visualization (no editing capability)
   * - Sharing final rendered molecular states
   *
   * @param scenes - Optional subset of scenes to export (exports all if not provided)
   * @returns Promise resolving to MVSData object or Uint8Array (ZIP)
   */
  async toMVS(scenes?: SceneData[]): Promise<MVSData | Uint8Array> {
    return utils.getMVSData(this.story, scenes);
  }

  /**
   * Export story as standalone HTML file with embedded Mol* viewer.
   *
   * Creates a single self-contained HTML file that includes:
   * - Embedded Mol* viewer libraries (loaded from CDN)
   * - Story MVS data inline
   * - No external dependencies needed
   *
   * Use this for:
   * - Quick sharing via email or file transfer
   * - Viewing without hosting infrastructure
   * - Embedding in documentation or reports
   *
   * @param options - Configuration options
   * @param options.title - HTML page title (defaults to story title)
   * @param options.molstarVersion - Specific Molstar version to use (defaults to latest)
   * @returns Promise resolving to HTML string
   */
  async toHTML(options?: { title?: string; molstarVersion?: string }): Promise<string> {
    const data = await this.toMVS();
    return generateStoriesHtml(
      { kind: 'embed', data },
      { title: options?.title || this.story.metadata.title, ...options }
    );
  }

  /**
   * Export story as self-hosted deployment package (.zip file).
   *
   * Creates a complete package containing:
   * - index.html with viewer
   * - story.mvsj or story.mvsx (MVS format for viewing)
   * - session.mvstory (source file for editing)
   * - All assets and dependencies
   *
   * The difference from .mvstory:
   * - .mvstory: Single compressed file for editing (like .psd)
   * - .zip: Complete deployment package with viewer (like exported website)
   *
   * Use this for:
   * - Self-hosting on a web server
   * - Offline viewing with full assets
   * - Distributing both viewer and editable source
   *
   * @param options - Configuration options
   * @param options.molstarVersion - Specific Molstar version to bundle
   * @returns Promise resolving to ZIP file bytes
   */
  async toSelfHostedZip(options?: { molstarVersion?: string }): Promise<Uint8Array> {
    return utils.createSelfHostedZip(this.story, options);
  }

  // --- Import Operations ---

  /**
   * Import story from JSON string.
   *
   * Deserializes a Story object from human-readable JSON format.
   * This is the inverse of toJSON().
   *
   * @param json - JSON string representation of a Story object
   * @returns New StoryManager instance with the loaded story
   * @throws Error if JSON is invalid or doesn't match Story schema
   */
  static fromJSON(json: string): StoryManager {
    const story = JSON.parse(json) as Story;
    return new StoryManager(story);
  }

  /**
   * Import story from compressed MVStory container (.mvstory file).
   *
   * Deserializes and decompresses a .mvstory file back into an editable Story object.
   * This is the inverse of toMVStory().
   *
   * The process:
   * 1. Inflate (decompress) the deflated data
   * 2. Decode MessagePack to StoryContainer
   * 3. Extract and validate Story object
   *
   * @param bytes - Compressed MVStory container bytes
   * @returns Promise resolving to new StoryManager instance with the loaded story
   * @throws Error if container is corrupted or version is unsupported
   */
  static async fromMVStory(bytes: Uint8Array): Promise<StoryManager> {
    const inflated = await Task.create('Inflate Story Data', async (ctx) => {
      return await inflate(ctx, new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength));
    }).run();

    const decoded = decodeMsgPack(
      new Uint8Array(inflated.buffer as ArrayBuffer, inflated.byteOffset, inflated.byteLength)
    ) as StoryContainer;
    if (decoded.version !== 1) {
      throw new Error(`Unsupported story version: ${decoded.version}`);
    }

    return new StoryManager(decoded.story);
  }

  // --- Static Helpers ---

  static createEmptyStory(): Story {
    return {
      metadata: { title: 'New Story' },
      javascript: '',
      scenes: [
        {
          id: UUID.createv4(),
          header: 'New Scene',
          key: '',
          description: '',
          javascript: '',
        },
      ],
      assets: [],
    };
  }
}
