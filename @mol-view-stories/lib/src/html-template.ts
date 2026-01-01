import type { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';
import { PLUGIN_VERSION } from 'molstar/lib/mol-plugin/version';

export function generateStoriesHtml(
  data:
    | { kind: 'embed'; data: MVSData | Uint8Array }
    | {
      kind: 'self-hosted';
      dataPath: string;
      sessionPath?: string;
      format: string;
    },
  options?: {
    title?: string;
    molstarVersion?: string;
    jsPath?: string;
    cssPath?: string;
  },
): string {
  const js = options?.jsPath ??
    `https://cdn.jsdelivr.net/npm/molstar@{{version}}/build/mvs-stories/mvs-stories.js`
      .replace(
        '{{version}}',
        options?.molstarVersion ?? PLUGIN_VERSION,
      );
  const css = options?.cssPath ??
    `https://cdn.jsdelivr.net/npm/molstar@{{version}}/build/mvs-stories/mvs-stories.css`
      .replace(
        '{{version}}',
        options?.molstarVersion ?? PLUGIN_VERSION,
      );

  let loader: string;
  let extraLinks: string = '';

  if (data.kind === 'embed') {
    const format = data.data instanceof Uint8Array ? 'mvsx' : 'mvsj';

    let state;
    if (data.data instanceof Uint8Array) {
      state = `"base64,${
        (data.data as unknown as { toBase64(): string }).toBase64()
      }"`;
    } else {
      state = JSON.stringify(data.data);
    }

    loader = `
        var mvsData = ${state};

        mvsStories.loadFromData(mvsData, { format: '${format}' });
    `;
  } else {
    if (data.sessionPath) {
      extraLinks = ExtraLinks.replaceAll(
        '{{session-link}}',
        data.sessionPath.replace('"', '\\"'),
      );
    }
    loader = `
        mvsStories.loadFromURL('${
      data.dataPath.replace("'", "\\'")
    }', { format: '${data.format}' });
    `;
  }

  const html = Template.replace('{{js-path}}', js)
    .replace('{{extra-links}}', extraLinks)
    .replace('{{css-path}}', css)
    .replace('{{title}}', options?.title ?? 'Untitled Story')
    .replace('{{loader}}', loader);

  return html;
}

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

        #links {
            position: absolute;
            bottom: 4px;
            right: 8px;
            font-family: "Raleway", "HelveticaNeue", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 0.6rem;
            z-index: -1;
            color: #666;
        }

        #links a {
            color: #666;
            text-decoration: none;
        }

        #links .sep {
            color: #aaa;
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
    <script src="{{js-path}}"></script>
    <link rel="stylesheet" type="text/css" href="{{css-path}}" />
</head>
<body>
    <div id="viewer">
        <mvs-stories-viewer></mvs-stories-viewer>
    </div>
    <div id="controls">
        <mvs-stories-snapshot-markdown style="flex-grow: 1;"></ mvs-stories-snapshot-markdown>
    </div>

    <div id="links">
        {{extra-links}}
        <a href="#" id="mvs-data" title="MolViewSpec State for this story. Can be opened in the Mol* app.">Download MVS</a> <span class="sep">•</span>
        <a href="https://molstar.org/mol-view-stories/" id="mvs-data" target="_blank" rel="noopener noreferrer">Created with MolViewStories</a> <span class="sep">•</span>
        <a href="https://molstar.org" id="mvs-data" target="_blank" rel="noopener noreferrer">Mol*</a>
    </div>

    <script>
        {{loader}}

        document.getElementById('mvs-data').addEventListener('click', (e) => {
            e.preventDefault();
            mvsStories.downloadCurrentStory();
        });
    </script>
</body>
</html>`;

const ExtraLinks = `
        <a href="{{session-link}}" title="Download a session file which can be opened in the MolViewStories Builder">Download Story Session</a>&nbsp;<span class="sep">•</span>
`;
