import { createStory } from "./create.ts";
import { watchStory } from "./watch.ts";
import { join } from "@std/path";

export interface ServeOptions {
  port?: number;
}

export async function serveTemplate(
  options: ServeOptions = {},
): Promise<{ cleanup: () => void }> {
  console.log("🚀 Creating temporary template and starting server...");

  // Create a temporary directory using Deno's built-in functionality
  const tempDir = await Deno.makeTempDir({ prefix: "mvs-template-" });
  const tempFolderName = "story";

  try {
    // Create the template story in the temp directory
    console.log(`📁 Creating temporary template in: ${tempDir}`);
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);
    await createStory(tempFolderName);
    Deno.chdir(originalCwd);

    console.log("✅ Template created successfully");
    console.log("🔄 Starting watch server...");

    // Start watching the temporary folder
    const storyPath = join(tempDir, tempFolderName);
    const { cleanup: watchCleanup } = await watchStory(storyPath, options);

    // Return cleanup function that removes the temp folder and stops the server
    const cleanup = async () => {
      console.log("🧹 Cleaning up temporary template...");
      try {
        watchCleanup();
        await Deno.remove(tempDir, { recursive: true });
        console.log(`✅ Removed temporary directory: ${tempDir}`);
      } catch (error) {
        console.error(
          `⚠️  Failed to clean up temporary directory: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    };

    // Set up cleanup on process termination
    const signals = ["SIGINT", "SIGTERM"] as const;

    for (const signal of signals) {
      Deno.addSignalListener(signal, async () => {
        console.log(`\n📡 Received ${signal}, cleaning up...`);
        await cleanup();
        Deno.exit(0);
      });
    }

    console.log(`\n🎉 Template server is running!`);
    console.log(
      `📖 View your story at: http://localhost:${options.port || 8080}`,
    );
    console.log(
      `🛑 Press Ctrl+C to stop the server and clean up the temporary files`,
    );
    console.log(
      `📂 Temporary directory: ${tempDir} (will be deleted when server stops)`,
    );

    return { cleanup };
  } catch (error) {
    // Clean up on error
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(
      `Failed to serve template: ${error instanceof Error ? error.message : error}`,
    );
  }
}
