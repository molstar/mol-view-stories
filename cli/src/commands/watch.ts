import { exists } from "@std/fs";
import { join } from "@std/path";
import { StoryContainer } from "@zachcp/molviewstory-types";
import { buildStory } from "./build.ts";
import {
  generateMVSJViewerHtml,
  generateMVSXViewerHtml,
} from "../templates/mvs-viewer-template.ts";

import { parse as parseYaml } from "@std/yaml";
import { walk } from "@std/fs";
import { basename, extname, relative } from "@std/path";

// Import the parseStoryFolder function from build.ts
async function parseStoryFolder(folderPath: string) {
  // We'll need to extract this function from build.ts or duplicate the logic
  // For now, let's use a simplified approach by calling buildStory indirectly

  console.error("Parsing story folder structure...");

  // Read main story.yaml
  const storyYamlPath = join(folderPath, "story.yaml");
  if (!(await exists(storyYamlPath))) {
    throw new Error("story.yaml not found in the root directory");
  }

  const storyYamlContent = await Deno.readTextFile(storyYamlPath);
  const storyData = parseYaml(storyYamlContent) as any;

  // Extract metadata
  const metadata = {
    title: storyData.metadata?.title || basename(folderPath),
  };

  console.error(`✓ Loaded story metadata: ${metadata.title}`);

  // Parse scenes
  const scenesDir = join(folderPath, "scenes");
  const scenes: any[] = [];

  if (await exists(scenesDir)) {
    const sceneNames: string[] = [];

    // Get all scene directories
    for await (const entry of Deno.readDir(scenesDir)) {
      if (entry.isDirectory) {
        sceneNames.push(entry.name);
      }
    }

    // Sort scene names to ensure consistent ordering
    sceneNames.sort();

    let sceneIndex = 0;
    for (const sceneName of sceneNames) {
      const sceneDir = join(scenesDir, sceneName);
      const scene = await parseSceneFolder(sceneDir, folderPath, sceneIndex);
      scenes.push(scene);
      console.error(`✓ Loaded scene: ${scene.header}`);
      sceneIndex++;
    }
  }

  if (scenes.length === 0) {
    console.error("⚠ Warning: No scenes found in the story");
  }

  // Parse assets
  const assets = await parseAssetsFolder(folderPath);

  // Read optional story.js file for global JavaScript
  const storyJsPath = join(folderPath, "story.js");
  let storyJavaScript = "";
  if (await exists(storyJsPath)) {
    storyJavaScript = await Deno.readTextFile(storyJsPath);
    console.error(
      `✓ Loaded story.js with ${storyJavaScript.length} characters`,
    );
  } else {
    console.error(
      "⚠ Warning: story.js not found, using empty story JavaScript",
    );
  }

  const javascript = storyJavaScript;

  const story = {
    metadata,
    javascript,
    scenes,
    assets,
  };

  console.error(`✓ Successfully parsed story with ${scenes.length} scenes`);
  return story;
}

async function parseSceneFolder(
  sceneDir: string,
  rootPath: string,
  sceneIndex: number,
) {
  const sceneName = basename(sceneDir);

  // Read scene YAML file
  const yamlPath = join(sceneDir, `${sceneName}.yaml`);
  if (!(await exists(yamlPath))) {
    throw new Error(
      `${sceneName}.yaml not found in scene directory: ${sceneName}`,
    );
  }

  const yamlContent = await Deno.readTextFile(yamlPath);
  const sceneData = parseYaml(yamlContent) as any;

  // Read scene description from MD file
  const mdPath = join(sceneDir, `${sceneName}.md`);
  let description = "";
  if (await exists(mdPath)) {
    description = await Deno.readTextFile(mdPath);
  } else {
    console.error(
      `⚠ Warning: ${sceneName}.md not found, using empty description`,
    );
  }

  // Read scene JavaScript from JS file
  const jsPath = join(sceneDir, `${sceneName}.js`);
  let javascript = "";
  if (await exists(jsPath)) {
    javascript = await Deno.readTextFile(jsPath);
  } else {
    console.error(
      `⚠ Warning: ${sceneName}.js not found, using empty JavaScript`,
    );
  }

  // Extract camera configuration if present
  let camera;
  if (sceneData.camera) {
    camera = {
      mode: sceneData.camera.mode || "perspective",
      target: sceneData.camera.target || [0, 0, 0],
      position: sceneData.camera.position || [10, 10, 10],
      up: sceneData.camera.up || [0, 1, 0],
      fov: sceneData.camera.fov || 45,
    };
  }

  const scene = {
    id: `scene_${sceneIndex + 1}`,
    header: sceneData.header || sceneName,
    key: sceneData.key || sceneName,
    description,
    javascript,
    camera,
    linger_duration_ms: sceneData.linger_duration_ms || 5000,
    transition_duration_ms: sceneData.transition_duration_ms || 1000,
  };

  return scene;
}

async function parseAssetsFolder(rootPath: string) {
  const assetsDir = join(rootPath, "assets");

  if (!(await exists(assetsDir))) {
    console.error("⚠ Warning: assets/ directory not found");
    return [];
  }

  const assets: any[] = [];

  // Walk through assets directory
  for await (const entry of walk(assetsDir, { includeDirs: false })) {
    const relativePath = relative(rootPath, entry.path);
    const rawContent = await Deno.readFile(entry.path);

    // Create content class that extends Uint8Array with toBase64 method
    class ContentWithBase64 extends Uint8Array {
      toBase64() {
        return btoa(String.fromCharCode.apply(null, Array.from(this)));
      }
    }

    const content = new ContentWithBase64(rawContent);

    assets.push({
      name: relativePath,
      content,
    });

    console.error(`✓ Loaded asset: ${relativePath}`);
  }

  return assets;
}

export async function watchStory(
  folderPath: string,
  options: { port?: number } = {},
): Promise<{ cleanup: () => Promise<void> }> {
  const port = options.port || 8080;

  // Check if we should use direct MVS serving (redirecting to mol-view-stories)
  const useDirectServing = Deno.env.get("MVS_DIRECT_SERVE") === "true";

  // Validate port
  if (port < 1 || port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }

  console.error(`Starting watch server for: ${folderPath}`);
  console.error(`Server will be available at: http://localhost:${port}`);
  console.error(
    `Serving mode: ${
      useDirectServing
        ? "Direct (redirect to mol-view-stories)"
        : "Local (embedded viewer)"
    }`,
  );

  // Validate folder exists and is a directory
  try {
    const stat = await Deno.stat(folderPath);
    if (!stat.isDirectory) {
      throw new Error(`'${folderPath}' is not a directory`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Folder '${folderPath}' does not exist`);
    }
    throw error;
  }

  // Create temporary directory for unpacked MVSX
  const tempDir = await Deno.makeTempDir({ prefix: "mvs-watch-" });
  console.error(`📁 Created temp directory: ${tempDir}`);

  let currentHtml = "";
  let isBuilding = false;
  let assetsUnpacked = false;

  // Deno utility functions for file operations
  const denoUtils = {
    async writeFile(path: string, data: Uint8Array): Promise<void> {
      await Deno.writeFile(path, data);
    },
    async readTextFile(path: string): Promise<string> {
      return await Deno.readTextFile(path);
    },
    async remove(path: string): Promise<void> {
      await Deno.remove(path);
    },
    async runUnzip(args: string[]): Promise<boolean> {
      const unzipProcess = new Deno.Command("unzip", {
        args,
        stdout: "null",
        stderr: "null",
      });
      const result = await unzipProcess.output();
      return result.success;
    },
  };

  // Pure function to handle MVSX unpacking logic
  function createUnpackMVSX(tempDir: string, utils: typeof denoUtils) {
    return async function unpackMVSX(mvsxData: Uint8Array): Promise<void> {
      // Write MVSX to temp file
      const tempMvsxPath = join(tempDir, "temp.mvsx");
      await utils.writeFile(tempMvsxPath, mvsxData);

      try {
        // Use unzip command to extract MVSX (which is a ZIP file)
        const success = await utils.runUnzip([
          "-o",
          tempMvsxPath,
          "-d",
          tempDir,
        ]);

        if (!success) {
          throw new Error("Failed to unzip MVSX file");
        }

        // Remove the temp MVSX file
        await utils.remove(tempMvsxPath);

        console.error(`📦 Unpacked MVSX to: ${tempDir}`);

        // Flatten assets directory - move all files from assets/ to root level
        const assetsDir = join(tempDir, "assets");
        try {
          if (await exists(assetsDir)) {
            for await (const entry of Deno.readDir(assetsDir)) {
              if (entry.isFile) {
                const sourcePath = join(assetsDir, entry.name);
                const destPath = join(tempDir, entry.name);
                await Deno.rename(sourcePath, destPath);
                console.error(`  📤 Moved ${entry.name} to root level`);
              }
            }
            // Remove empty assets directory
            await Deno.remove(assetsDir);
          }
        } catch (e) {
          console.error(`  ⚠️ Could not flatten assets: ${e}`);
        }

        // Debug: List files in temp directory
        try {
          for await (const entry of Deno.readDir(tempDir)) {
            console.error(
              `  📄 ${entry.name} (${entry.isFile ? "file" : "dir"})`,
            );
          }
        } catch (e) {
          console.error(`  ⚠️ Could not list temp directory: ${e}`);
        }
      } catch (error) {
        throw new Error(
          `Failed to unpack MVSX: ${error instanceof Error ? error.message : error}`,
        );
      }
    };
  }

  const unpackMVSX = createUnpackMVSX(tempDir, denoUtils);

  // Function to generate redirect HTML for direct MVS serving
  function generateDirectViewerHtml(title: string, hasAssets: boolean): string {
    const fileUrl = hasAssets
      ? `http://localhost:${port}/story.mvsx`
      : `http://localhost:${port}/story.mvsj`;

    const viewerUrl = hasAssets
      ? `https://molstar.org/mol-view-stories/?mvsx-url=${encodeURIComponent(fileUrl)}`
      : `https://molstar.org/mol-view-stories/?mvsj-url=${encodeURIComponent(fileUrl)}`;

    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <meta http-equiv="refresh" content="0; url=${viewerUrl}">
</head>
<body>
    <h1>Loading ${title}...</h1>
    <p>Redirecting to MVS Stories viewer...</p>
    <p>If not redirected automatically, <a href="${viewerUrl}">click here</a>.</p>
</body>
</html>`;
  }

  // Pure function to generate HTML for MVSX viewer (fallback)
  function generateMVSXViewerHtml(title: string): string {
    return generateMVSJViewerHtml({ title });
  }

  // Function to rebuild the story and generate HTML
  async function rebuildStory(): Promise<void> {
    if (isBuilding) return;

    isBuilding = true;
    try {
      console.error("\n🔄 Rebuilding story...");

      // Parse the story structure
      const story = await parseStoryFolder(folderPath);

      // Create StoryContainer with the parsed story
      const storyContainer = new StoryContainer(story);

      // Generate MVSX data or JSON
      const mvsData = await storyContainer.generate();

      if (mvsData instanceof Uint8Array) {
        // MVSX format (has assets) - unpack the zip file
        console.error("📦 Processing MVSX format (with assets)");

        // Unpack MVSX to temp directory (only once, or if assets changed)
        if (!assetsUnpacked) {
          await unpackMVSX(mvsData);
          assetsUnpacked = true;
        } else {
          // Only update the JSON file for fast reload
          const tempMvsxPath = join(tempDir, "temp.mvsx");
          await denoUtils.writeFile(tempMvsxPath, mvsData);

          const success = await denoUtils.runUnzip([
            "-o",
            tempMvsxPath,
            "index.mvsj",
            "-d",
            tempDir,
          ]);

          if (!success) {
            throw new Error("Failed to update JSON file");
          }

          await denoUtils.remove(tempMvsxPath);
          console.error("📝 Updated index.mvsj");
        }
      } else {
        // JSON format (no assets) - write JSON directly
        console.error("📄 Processing JSON format (no assets)");

        const indexPath = join(tempDir, "index.mvsj");
        const jsonContent = JSON.stringify(mvsData, null, 2);
        await Deno.writeTextFile(indexPath, jsonContent);
        console.error("📝 Created index.mvsj from JSON");

        assetsUnpacked = true; // Mark as processed
      }

      // Generate HTML - either direct redirect or local viewer
      if (useDirectServing) {
        currentHtml = generateDirectViewerHtml(
          story.metadata?.title || "MVS Story",
          mvsData instanceof Uint8Array,
        );
        console.error(
          `🔗 Using direct serving mode - will redirect to mol-view-stories`,
        );
      } else {
        currentHtml = generateMVSXViewerHtml(
          story.metadata?.title || "MVS Story",
        );
        console.error(
          `🖥️ Using local viewer mode - serving with embedded templates`,
        );
      }

      console.error("✅ Story rebuilt successfully");
    } catch (error) {
      throw new Error(
        `Failed to rebuild story: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      isBuilding = false;
    }
  }

  // Initial build
  await rebuildStory();

  // Set up file watcher
  const watcher = Deno.watchFs(folderPath);
  let watcherClosed = false;

  // Debounce rebuilds to avoid excessive rebuilding
  let rebuildTimeout: number | undefined;

  // Start the file watcher in the background
  const watcherPromise = (async () => {
    try {
      for await (const event of watcher) {
        if (watcherClosed) break;

        if (
          event.kind === "modify" ||
          event.kind === "create" ||
          event.kind === "remove"
        ) {
          console.error(
            `📝 File change detected: ${event.kind} - ${event.paths.join(", ")}`,
          );

          // Clear any existing timeout
          if (rebuildTimeout) {
            clearTimeout(rebuildTimeout);
          }

          // Debounce rebuilds (wait 500ms after last change)
          rebuildTimeout = setTimeout(() => {
            rebuildStory();
          }, 500);
        }
      }
    } catch (error) {
      if (!watcherClosed) {
        console.error("Watcher error:", error);
      }
    }
  })();

  // HTTP Server - serves from temp directory
  const server = Deno.serve({ port }, async (req: Request) => {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/" || url.pathname.endsWith(".html")) {
      return new Response(currentHtml, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache, no-store, must-revalidate",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Handle direct MVS file serving for direct mode
    if (useDirectServing) {
      if (url.pathname === "/story.mvsx") {
        // Rebuild story to get latest MVSX data
        const story = await parseStoryFolder(folderPath);
        const storyContainer = new StoryContainer(story);
        const mvsData = await storyContainer.generate();

        if (mvsData instanceof Uint8Array) {
          return new Response(mvsData, {
            headers: {
              "content-type": "application/zip",
              "content-disposition": 'attachment; filename="story.mvsx"',
              "access-control-allow-origin": "*",
            },
          });
        } else {
          return new Response("MVSX not available for this story", {
            status: 404,
          });
        }
      }

      if (url.pathname === "/story.mvsj") {
        // Rebuild story to get latest MVSJ data
        const story = await parseStoryFolder(folderPath);
        const storyContainer = new StoryContainer(story);
        const mvsData = await storyContainer.generate();

        if (!(mvsData instanceof Uint8Array)) {
          return new Response(JSON.stringify(mvsData, null, 2), {
            headers: {
              "content-type": "application/json",
              "access-control-allow-origin": "*",
            },
          });
        } else {
          return new Response(
            "MVSJ not available - story has assets, use MVSX",
            { status: 404 },
          );
        }
      }

      if (url.pathname === "/info") {
        // Provide story info
        const story = await parseStoryFolder(folderPath);
        const storyContainer = new StoryContainer(story);
        const mvsData = await storyContainer.generate();

        const info = {
          title: story.metadata?.title || "Untitled",
          scenes: story.scenes.length,
          assets: story.assets.length,
          hasAssets: mvsData instanceof Uint8Array,
          format: mvsData instanceof Uint8Array ? "mvsx" : "mvsj",
          size:
            mvsData instanceof Uint8Array
              ? mvsData.length
              : JSON.stringify(mvsData).length,
        };

        return new Response(JSON.stringify(info, null, 2), {
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
          },
        });
      }
    }

    // Serve files from temp directory (MVSX unpacked files)
    if (url.pathname !== "/" && !url.pathname.includes("..")) {
      const fileName = url.pathname.substring(1); // Remove leading slash
      const filePath = join(tempDir, fileName);

      try {
        if (await exists(filePath)) {
          const stat = await Deno.stat(filePath);
          if (stat.isFile) {
            const content = await Deno.readFile(filePath);

            // Determine content type based on file extension
            const ext = extname(filePath).toLowerCase();
            let contentType = "application/octet-stream";
            if (ext === ".mvsj") contentType = "application/json";
            else if (ext === ".pdb") contentType = "text/plain";
            else if (ext === ".mol2") contentType = "text/plain";
            else if (ext === ".sdf") contentType = "text/plain";
            else if (ext === ".cif") contentType = "text/plain";
            else if (ext === ".bcif") contentType = "application/octet-stream";

            return new Response(content, {
              headers: {
                "content-type": contentType,
                "cache-control": "no-cache, no-store, must-revalidate",
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "GET, OPTIONS",
                "access-control-allow-headers": "Content-Type",
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error serving file ${filePath}:`, error);
      }

      // Debug: File not found, show what files exist
      console.error(`❌ File not found: ${filePath}`);
      try {
        console.error(`📁 Temp directory contents:`);
        for await (const entry of Deno.readDir(tempDir)) {
          console.error(`  📄 ${entry.name}`);
        }
      } catch (e) {
        console.error(`  ⚠️ Could not list temp directory: ${e}`);
      }
    }

    // Handle other requests with a simple 404
    return new Response("Not Found", { status: 404 });
  });

  console.error(`🚀 Watch server started on http://localhost:${port}`);
  console.error("👀 Watching for file changes...");
  console.error("Press Ctrl+C to stop");

  // Return cleanup function for testing
  const cleanup = async () => {
    watcherClosed = true;
    try {
      watcher.close();
    } catch (error) {
      throw new Error(`Failed to close file watcher: ${error}`);
    }
    try {
      await server.shutdown();
    } catch (error) {
      throw new Error(`Failed to shutdown server: ${error}`);
    }
    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }
    // Clean up temp directory
    try {
      await Deno.remove(tempDir, { recursive: true });
      console.error(`🗑️ Cleaned up temp directory: ${tempDir}`);
    } catch (error) {
      console.error(`Warning: Could not clean up temp directory: ${error}`);
    }
  };

  // In production, wait for server to finish
  if (Deno.env.get("DENO_TESTING") !== "true") {
    await server.finished;
  }

  return { cleanup };
}
