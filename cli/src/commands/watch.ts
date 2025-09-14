import { exists } from '@std/fs';
import { join } from '@std/path';
import { StoryManager } from '@mol-view-stories/lib/StoryManager';
import { parseStoryFolder } from './build.ts';
import { generateMVSJViewerHtml, generateMVSXViewerHtml } from '../templates/mvs-viewer-template.ts';

export async function watchStory(
  folderPath: string,
  options: { port?: number } = {}
): Promise<{ cleanup: () => Promise<void> }> {
  const port = options.port || 8080;

  // Check if we should use direct MVS serving (redirecting to mol-view-stories)
  const useDirectServing = Deno.env.get('MVS_DIRECT_SERVE') === 'true';

  // Validate port
  if (port < 1 || port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  console.error(`Starting watch server for: ${folderPath}`);
  console.error(`Server will be available at: http://localhost:${port}`);
  console.error(
    `Serving mode: ${useDirectServing ? 'Direct (redirect to mol-view-stories)' : 'Local (embedded viewer)'}`
  );

  // Validate folder exists
  if (!(await exists(folderPath))) {
    throw new Error(`Folder '${folderPath}' does not exist`);
  }

  const stat = await Deno.stat(folderPath);
  if (!stat.isDirectory) {
    throw new Error(`'${folderPath}' is not a directory`);
  }

  // Create temp directory for serving files
  const tempDir = await Deno.makeTempDir({ prefix: 'mvs-watch-' });
  console.error(`📁 Created temp directory: ${tempDir}`);

  let abortController = new AbortController();

  // Function to rebuild the story
  async function rebuildStory() {
    try {
      console.error('\n🔄 Rebuilding story...');

      // Parse the story structure using shared function from build.ts
      const story = await parseStoryFolder(folderPath);

      // Create StoryManager with the parsed story
      const manager = new StoryManager(story);

      // Generate output based on whether assets exist
      const hasAssets = story.assets && story.assets.length > 0;

      if (hasAssets) {
        console.error('📦 Processing MVSX format (with assets)');
        const mvsData = await manager.toMVS();

        if (mvsData instanceof Uint8Array) {
          // Save MVSX file
          const mvsxPath = join(tempDir, 'index.mvsx');
          await Deno.writeFile(mvsxPath, mvsData);
          console.error('📝 Created index.mvsx from binary data');
        } else {
          // Save MVSJ file
          const mvsjPath = join(tempDir, 'index.mvsj');
          await Deno.writeTextFile(mvsjPath, JSON.stringify(mvsData, null, 2));
          console.error('📝 Created index.mvsj from JSON');
        }
      } else {
        console.error('📄 Processing JSON format (no assets)');
        const mvsData = await manager.toMVS();

        // Always save as MVSJ when no assets
        const mvsjPath = join(tempDir, 'index.mvsj');
        if (mvsData instanceof Uint8Array) {
          // This shouldn't happen without assets, but handle it
          await Deno.writeFile(mvsjPath, mvsData);
        } else {
          await Deno.writeTextFile(mvsjPath, JSON.stringify(mvsData, null, 2));
        }
        console.error('📝 Created index.mvsj from JSON');
      }

      if (useDirectServing) {
        console.error('🌐 Using direct serving mode - files ready for redirect to mol-view-stories');
      } else {
        console.error('🖥️ Using local viewer mode - serving with embedded templates');
      }

      console.error('✅ Story rebuilt successfully');
    } catch (error) {
      console.error('❌ Failed to rebuild story:', error instanceof Error ? error.message : error);
    }
  }

  // Initial build
  await rebuildStory();

  // Set up file watcher
  const watcher = Deno.watchFs(folderPath, { recursive: true });

  // File watching loop
  const watchLoop = async () => {
    try {
      for await (const event of watcher) {
        if (abortController.signal.aborted) break;

        // Only rebuild on file modifications, not directory changes
        if (event.kind === 'modify' || event.kind === 'create' || event.kind === 'remove') {
          // Debounce rapid changes
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!abortController.signal.aborted) {
            await rebuildStory();
          }
        }
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('❌ File watcher error:', error);
      }
    }
  };

  // Start file watching
  watchLoop();

  // Create HTTP server
  const server = Deno.serve(
    {
      port,
      signal: abortController.signal,
      onListen: () => {
        console.error(`🚀 Watch server started on http://localhost:${port}`);
        console.error('👀 Watching for file changes...');
        console.error('Press Ctrl+C to stop');
      },
    },
    async (request) => {
      const url = new URL(request.url);

      // Handle direct MVS file serving for direct mode
      if (useDirectServing) {
        if (url.pathname === '/story.mvsx') {
          // Rebuild story to get latest MVSX data
          const story = await parseStoryFolder(folderPath);
          const storyManager = new StoryManager(story);
          const mvsData = await storyManager.toMVS();

          if (mvsData instanceof Uint8Array) {
            return new Response(mvsData as BodyInit, {
              headers: {
                'content-type': 'application/zip',
                'content-disposition': 'attachment; filename="story.mvsx"',
                'access-control-allow-origin': '*',
              },
            });
          } else {
            return new Response('MVSX not available for this story', {
              status: 404,
            });
          }
        }

        if (url.pathname === '/story.mvsj') {
          // Rebuild story to get latest MVSJ data
          const story = await parseStoryFolder(folderPath);
          const storyManager = new StoryManager(story);
          const mvsData = await storyManager.toMVS();

          const jsonData =
            mvsData instanceof Uint8Array ? 'Binary MVSX data not available as JSON' : JSON.stringify(mvsData, null, 2);

          return new Response(jsonData, {
            headers: {
              'content-type': 'application/json',
              'access-control-allow-origin': '*',
            },
          });
        }

        // For direct serving mode, redirect to mol-view-stories with the story URL
        if (url.pathname === '/' || url.pathname === '/index.html') {
          const storyUrl = `http://localhost:${port}/story.mvsj`;
          const redirectUrl = `https://molstar.org/mol-view-stories/?load=${encodeURIComponent(storyUrl)}`;

          return new Response(
            `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to MolView Stories...</title>
  <meta http-equiv="refresh" content="0; url=${redirectUrl}">
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">MolView Stories</a>...</p>
  <script>window.location.href = '${redirectUrl}';</script>
</body>
</html>
        `.trim(),
            {
              headers: { 'content-type': 'text/html' },
            }
          );
        }
      }

      // Local serving mode - serve with embedded viewer
      if (url.pathname === '/' || url.pathname === '/index.html') {
        // Check if we have MVSX or MVSJ file
        const mvsxPath = join(tempDir, 'index.mvsx');
        const mvsjPath = join(tempDir, 'index.mvsj');

        try {
          if (await exists(mvsxPath)) {
            const story = await parseStoryFolder(folderPath);
            const html = generateMVSXViewerHtml({ title: story.metadata?.title });
            return new Response(html, {
              headers: { 'content-type': 'text/html' },
            });
          } else if (await exists(mvsjPath)) {
            const story = await parseStoryFolder(folderPath);
            const html = generateMVSJViewerHtml({ title: story.metadata?.title });
            return new Response(html, {
              headers: { 'content-type': 'text/html' },
            });
          } else {
            return new Response('Story files not ready yet. Please wait and refresh.', {
              status: 503,
            });
          }
        } catch (error) {
          return new Response(`Error serving story: ${error instanceof Error ? error.message : error}`, {
            status: 500,
          });
        }
      }

      // Serve static files from temp directory
      try {
        const filePath = join(tempDir, url.pathname.slice(1));

        if (await exists(filePath)) {
          const stat = await Deno.stat(filePath);
          if (stat.isFile) {
            const content = await Deno.readFile(filePath);
            const ext = filePath.split('.').pop();
            const mimeType =
              ext === 'mvsj' ? 'application/json' : ext === 'mvsx' ? 'application/zip' : 'application/octet-stream';

            return new Response(content, {
              headers: {
                'content-type': mimeType,
                'access-control-allow-origin': '*',
              },
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ File not found: ${join(tempDir, url.pathname.slice(1))}`);

        // Debug: List temp directory contents
        console.error('📁 Temp directory contents:');
        try {
          for await (const entry of Deno.readDir(tempDir)) {
            console.error(`  📄 ${entry.name}`);
          }
        } catch (listError) {
          console.error('❌ Could not list temp directory');
        }
      }

      return new Response('Not Found', { status: 404 });
    }
  );

  // Return cleanup function
  return {
    async cleanup() {
      console.error('\n🛑 Stopping watch server...');
      abortController.abort();

      try {
        await server.finished;
      } catch (error) {
        // Server cleanup errors can be ignored
      }

      // Clean up temp directory
      try {
        await Deno.remove(tempDir, { recursive: true });
        console.error('🗑️ Cleaned up temp directory');
      } catch (error) {
        console.error('⚠️ Warning: Could not clean up temp directory:', error instanceof Error ? error.message : error);
      }
    },
  };
}
