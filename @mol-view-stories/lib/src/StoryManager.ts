import { Story, SceneData, SceneAsset, StoryContainer } from './types.ts';
import { UUID } from 'molstar/lib/mol-util/uuid.js';
import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data.js';
import { Task } from 'molstar/lib/mol-task/index.js';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode.js';
import { decodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/decode.js';
import { deflate, inflate } from 'molstar/lib/mol-util/zip/zip.js';
import { generateStoriesHtml } from './html-template.ts';
import * as actions from './actions.ts';

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
   * Export as plain JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.story, null, 2);
  }

  /**
   * Export as compressed container (.mvstory format)
   */
  async toContainer(): Promise<Uint8Array> {
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
   * Export as MVS data for Mol* viewer
   */
  async toMVS(scenes?: SceneData[]): Promise<MVSData | Uint8Array> {
    return actions.getMVSData(this.story, scenes);
  }

  /**
   * Export as standalone HTML
   */
  async toHTML(options?: { title?: string; molstarVersion?: string }): Promise<string> {
    const data = await this.toMVS();
    return generateStoriesHtml(
      { kind: 'embed', data },
      { title: options?.title || this.story.metadata.title, ...options }
    );
  }

  /**
   * Export as self-hosted zip
   */
  async toSelfHostedZip(options?: { molstarVersion?: string }): Promise<Uint8Array> {
    return actions.createSelfHostedZip(this.story, options);
  }

  // --- Import Operations ---

  /**
   * Import from JSON string
   */
  static fromJSON(json: string): StoryManager {
    const story = JSON.parse(json) as Story;
    return new StoryManager(story);
  }

  /**
   * Import from compressed container
   */
  static async fromContainer(bytes: Uint8Array): Promise<StoryManager> {
    const inflatedRaw = await Task.create('Inflate Story Data', async (ctx) => {
      return await inflate(ctx, bytes);
    }).run();

    const inflated: Uint8Array<ArrayBuffer> = new Uint8Array(
      inflatedRaw.buffer,
      inflatedRaw.byteOffset,
      inflatedRaw.byteLength
    );
    const decoded = decodeMsgPack(inflated) as StoryContainer;
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
