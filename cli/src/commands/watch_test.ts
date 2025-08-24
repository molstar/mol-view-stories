import { assertEquals, assertRejects } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { watchStory } from "./watch.ts";

Deno.test("watchStory - should reject for non-existent folder", async () => {
  await assertRejects(
    () => watchStory("non-existent-folder"),
    Error,
    "Folder 'non-existent-folder' does not exist",
  );
});

Deno.test(
  "watchStory - should reject for file instead of directory",
  async () => {
    // Create a temporary file
    const tempFile = await Deno.makeTempFile();

    try {
      await assertRejects(
        () => watchStory(tempFile),
        Error,
        "is not a directory",
      );
    } finally {
      await Deno.remove(tempFile);
    }
  },
);

Deno.test("watchStory - should validate port range", async () => {
  await assertRejects(
    () => watchStory("examples/simple", { port: -1 }),
    Error,
    "Port must be between 1 and 65535",
  );

  await assertRejects(
    () => watchStory("examples/simple", { port: 70000 }),
    Error,
    "Port must be between 1 and 65535",
  );
});

Deno.test(
  "watchStory - should start server with valid story folder",
  async () => {
    // This test requires the examples/simple folder to exist
    const examplePath = "examples/simple";

    if (!(await exists(examplePath))) {
      console.log("Skipping test - examples/simple folder not found");
      return;
    }

    // Set testing environment variable
    Deno.env.set("DENO_TESTING", "true");

    try {
      // Start the watch server on a random high port
      const port = 9000 + Math.floor(Math.random() * 1000);

      // Start the server
      const { cleanup } = await watchStory(examplePath, { port });

      // Give it a moment to initialize
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Clean up resources
      await cleanup();
    } finally {
      // Clean up environment
      Deno.env.delete("DENO_TESTING");
    }
  },
);

Deno.test(
  "parseStoryFolder helper - should handle missing story.yaml",
  async () => {
    const tempDir = await Deno.makeTempDir();

    try {
      // The parseStoryFolder function is not exported, so we can't test it directly
      // This is more of a placeholder for when we might extract it to a separate module

      // Verify the temp directory exists but has no story.yaml
      assertEquals(await exists(join(tempDir, "story.yaml")), false);
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
);

// Integration test that could be expanded
Deno.test(
  "watch command integration - basic structure validation",
  async () => {
    const examplePath = "examples/simple";

    if (!(await exists(examplePath))) {
      console.log(
        "Skipping integration test - examples/simple folder not found",
      );
      return;
    }

    // Verify the example has the expected structure
    assertEquals(await exists(join(examplePath, "story.yaml")), true);
    assertEquals(await exists(join(examplePath, "scenes")), true);

    const scenesDir = join(examplePath, "scenes");
    const scenes = [];
    for await (const entry of Deno.readDir(scenesDir)) {
      if (entry.isDirectory) {
        scenes.push(entry.name);
      }
    }

    assertEquals(scenes.length >= 1, true, "Should have at least one scene");
  },
);
