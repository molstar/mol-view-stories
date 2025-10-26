#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

import { parseArgs } from '@std/cli';
import { createStory } from './src/commands/create.ts';
import { buildStory, type BuildFormat } from './src/commands/build.ts';
import { watchStory } from './src/commands/watch.ts';
import { serveTemplate } from './src/commands/serve.ts';

const VERSION = '0.1.0';

function showHelp() {
  console.log(`MVS CLI - MolViewPack Story Creator v${VERSION}

USAGE:
  mvs <command> [options] [args]

COMMANDS:
  create <story-name>              Create a new story (inline by default, or --split for folders)
  build <folder-path> [options]    Build StoryContainer from folder structure
  watch <folder-path> [options]    Watch folder and serve story with live reload
  watch template [options]         Create temporary template and serve it with live reload

OPTIONS:
  -h, --help                       Show this help message
  -v, --version                    Show version information
  -o, --output <file>              Output file (build command only, defaults to stdout)
  -f, --format <format>            Output format: json, mvsx, mvstory, html (build command only)
  -p, --port <number>              Port for watch server (defaults to 8080)
  --split                          Create folder structure with separate scene files (create command only)

ENVIRONMENT VARIABLES:
  MVS_DIRECT_SERVE=true            Use direct serving mode (redirect to mol-view-stories)

SERVING MODES:
  Local Mode (default)             Serves story using embedded MVS Stories viewer
  Direct Mode                      Serves MVS files and redirects to mol-view-stories online

EXAMPLES:
  mvs create my-protein-story      Creates inline story "my-protein-story" (single story.yaml)
  mvs create my-protein-story --add-folders   Creates folder-based story with separate scene files
  mvs build ./my-story             Output StoryContainer JSON to stdout</parameter>
  mvs build ./my-story -o story.json   Save StoryContainer to story.json
  mvs build ./my-story -f json     Force JSON format output
  mvs build ./my-story -f mvsx -o story.mvsx   Save as MVSX format
  mvs build ./my-story -f mvstory -o story.mvstory   Save as MVStory format
  mvs build ./my-story -f html -o story.html     Save as standalone HTML
  mvs watch ./my-story             Watch and serve story locally on http://localhost:8080
  mvs watch ./my-story -p 3000     Watch and serve story locally on http://localhost:3000
  MVS_DIRECT_SERVE=true mvs watch ./my-story  Direct serve with redirect to mol-view-stories
  mvs watch template               Create temp template and serve on http://localhost:8080
  mvs watch template -p 3000       Create temp template and serve on http://localhost:3000

For more information, visit: https://github.com/zachcp/mvs-cli
`);
}

function showVersion() {
  console.log(`MVS CLI v${VERSION}`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ['help', 'version', 'add-folders'],
    string: ['output', 'port', 'format'],
    alias: {
      h: 'help',
      v: 'version',
      a: 'add-folders',
      o: 'output',
      f: 'format',
      p: 'port',
    },
  });

  // Show help
  if (args.help) {
    showHelp();
    Deno.exit(0);
  }

  // Show version
  if (args.version) {
    showVersion();
    Deno.exit(0);
  }

  const command = args._[0] as string;
  const commandArgs = args._.slice(1);

  try {
    switch (command) {
      case 'create': {
        if (commandArgs.length !== 1) {
          console.error("Error: 'create' command requires exactly one argument: <story-name>");
          console.error('Usage: mvs create <story-name> [--split]');
          Deno.exit(1);
        }
        const storyName = commandArgs[0] as string;
        const split = args['add-folders'] as boolean | undefined;
        await createStory(storyName, { split });
        break;
      }

      case 'build': {
        if (commandArgs.length !== 1) {
          console.error("Error: 'build' command requires exactly one argument: <folder-path>");
          console.error('Usage: mvs build <folder-path> [--output <file>] [--format <format>]');
          Deno.exit(1);
        }
        const folderPath = commandArgs[0] as string;
        const outputFile = args.output;
        const format = args.format as BuildFormat | undefined;

        // Validate format if provided
        if (format && !['json', 'mvsx', 'mvstory', 'html'].includes(format)) {
          console.error(`Error: Invalid format '${format}'. Supported formats: json, mvsx, mvstory, html`);
          Deno.exit(1);
        }

        await buildStory(folderPath, outputFile, format);
        break;
      }

      case 'watch': {
        if (commandArgs.length !== 1) {
          console.error("Error: 'watch' command requires exactly one argument: <folder-path> or 'template'");
          console.error('Usage: mvs watch <folder-path> [--port <number>]');
          console.error('       mvs watch template [--port <number>]');
          Deno.exit(1);
        }

        const port = args.port ? parseInt(args.port, 10) : undefined;

        if (port !== undefined && (isNaN(port) || port < 1 || port > 65535)) {
          console.error('Error: Port must be a number between 1 and 65535');
          Deno.exit(1);
        }

        if (commandArgs[0] === 'template') {
          // Watch template mode
          const { cleanup } = await serveTemplate({ port });
        } else {
          // Watch folder mode
          const folderPath = commandArgs[0] as string;
          const { cleanup } = await watchStory(folderPath, { port });
        }

        // In production mode, the server runs indefinitely
        // The cleanup function is available but not called here
        break;
      }

      case undefined:
        console.error('Error: No command specified');
        showHelp();
        Deno.exit(1);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error("Run 'mvs --help' for usage information");
        Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
