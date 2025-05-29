import { MVSData } from 'molstar/lib/extensions/mvs/mvs-data';

export function generateStoriesHtml(data: MVSData | Uint8Array, molstarVersion: string = 'latest'): string {
  const format = data instanceof Uint8Array ? 'mvsx' : 'mvsj';

  let state;

  if (data instanceof Uint8Array) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state = `"base64,${(data as any).toBase64()}"`;
  } else {
    state = JSON.stringify(data);
  }

  const html = Template.replaceAll('{{version}}', molstarVersion)
    .replace('{{format}}', format)
    .replace('{{state}}', state);

  return html;
}

const Template = `<!DOCTYPE html>
<html lang="en">
<head>
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
