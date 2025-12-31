// Enhanced template utilities for MVS Stories viewer
// Based on molstar/mol-view-stories template with support for both MVSJ and MVSX formats

export interface ViewerTemplateOptions {
  title?: string;
  molstarVersion?: string;
}

/**
 * Generate HTML template that can load from unpacked MVSX directory (MVSJ + assets)
 * This is used by the watch command when serving from a directory structure
 */
export function generateMVSJViewerHtml(options?: ViewerTemplateOptions): string {
  const title = options?.title ?? 'MVS Story';
  const version = options?.molstarVersion ?? '5.5.0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
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
    <script src="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.css" />
</head>
<body>
    <div id="viewer">
        <mvs-stories-viewer></mvs-stories-viewer>
    </div>
    <div id="controls">
        <mvs-stories-snapshot-markdown style="flex-grow: 1;"></mvs-stories-snapshot-markdown>
    </div>

    <script>
        // Fetch the MVSJ data from unpacked directory
        fetch('/index.mvsj')
            .then(function(response) {
                console.log('Fetch response status:', response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch MVSJ: ' + response.statusText);
                }
                return response.text();
            })
            .then(function(mvsjText) {
                console.log('MVSJ text received, length:', mvsjText.length);

                // Parse JSON
                var mvsjData;
                try {
                    mvsjData = JSON.parse(mvsjText);
                    console.log('JSON parsed successfully');
                    console.log('MVSJ structure:', Object.keys(mvsjData));
                } catch (e) {
                    throw new Error('Invalid JSON in MVSJ file: ' + e.message);
                }

                // Load using MVS Stories format
                console.log('Loading with mvsStories...');

                // Determine format - check if it's the multi-scene format we generate
                var format = 'mvsj';
                if (mvsjData.kind === 'multiple' && mvsjData.snapshots) {
                    // This is our custom multi-scene format
                    console.log('Detected multi-scene format');
                    mvsStories.loadFromData(mvsjData, { format: format });
                } else if (mvsjData.root) {
                    // This is standard MolViewSpec format
                    console.log('Detected standard MolViewSpec format');
                    mvsStories.loadFromData(mvsjData, { format: format });
                } else {
                    throw new Error('Unsupported MVSJ format - no root or snapshots found');
                }

                console.log('✅ MVS Story loaded successfully!');
            })
            .catch(function(error) {
                console.error('❌ Error loading MVS Story:', error);
                console.error('Error stack:', error.stack);
                document.body.innerHTML =
                    '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: red; flex-direction: column;">' +
                    '<h2>Error Loading Story</h2>' +
                    '<p>' + error.message + '</p>' +
                    '<small>' + (error.stack ? error.stack.split('\\n')[0] : 'No stack trace') + '</small>' +
                    '</div>';
            });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML template that can load MVSX files directly
 * This is used when serving a complete MVSX zip file
 */
export function generateMVSXViewerHtml(options?: ViewerTemplateOptions): string {
  const title = options?.title ?? 'MVS Story';
  const version = options?.molstarVersion ?? '5.5.0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
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
    <script src="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.css" />
</head>
<body>
    <div id="viewer">
        <mvs-stories-viewer></mvs-stories-viewer>
    </div>
    <div id="controls">
        <mvs-stories-snapshot-markdown style="flex-grow: 1;"></mvs-stories-snapshot-markdown>
    </div>

    <script>
        // Load MVSX file directly
        console.log('Loading MVSX file...');

        // Add console warning override to suppress non-critical MVS warnings
        var originalWarn = console.warn;
        console.warn = function(message) {
            if (typeof message === 'string' && message.includes('Invalid MVS tree')) {
                console.log('ℹ️ MVS validation info (non-critical):', message);
                return;
            }
            originalWarn.apply(console, arguments);
        };

        fetch('/index.mvsx')
            .then(function(response) {
                console.log('MVSX fetch response status:', response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch MVSX: ' + response.statusText);
                }
                return response.arrayBuffer();
            })
            .then(function(arrayBuffer) {
                console.log('MVSX data received, size:', arrayBuffer.byteLength);

                // Convert ArrayBuffer to Uint8Array for MVS Stories
                var mvsx = new Uint8Array(arrayBuffer);

                // Load MVSX data using MVS Stories with error handling
                try {
                    mvsStories.loadFromData(mvsx, { format: 'mvsx' });
                    console.log('✅ MVSX Story loaded successfully!');

                    // Wait a bit and check if the viewer actually loaded content
                    setTimeout(function() {
                        var viewer = document.querySelector('mvs-stories-viewer');
                        if (viewer) {
                            console.log('✅ MVS Stories viewer is active');
                        }
                    }, 1000);
                } catch (loadError) {
                    console.error('❌ Error during MVSX loading:', loadError);
                    throw loadError;
                }
            })
            .catch(function(error) {
                console.error('❌ Error loading MVSX Story:', error);
                document.body.innerHTML =
                    '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: red; flex-direction: column;">' +
                    '<h2>Error Loading MVSX Story</h2>' +
                    '<p>' + error.message + '</p>' +
                    '<small style="margin-top: 10px; max-width: 80%; text-align: center;">' +
                    'Try refreshing the page or check the browser console for more details.' +
                    '</small>' +
                    '</div>';
            });
    </script>
</body>
</html>`;
}

/**
 * Generate HTML template with inline data (like the original molstar/mol-view-stories template)
 * This is used for build command when generating standalone HTML files
 */
export function generateInlineStoriesHtml(data: any | Uint8Array, options?: ViewerTemplateOptions): string {
  const title = options?.title ?? 'MVS Story';
  const version = options?.molstarVersion ?? '5.5.0';
  const format = data instanceof Uint8Array ? 'mvsx' : 'mvsj';

  let state: string;

  if (data instanceof Uint8Array) {
    // For MVSX data, encode as base64
    const base64 = btoa(String.fromCharCode(...data));
    state = `"base64,${base64}"`;
  } else {
    // For JSON data, stringify
    state = JSON.stringify(data);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
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
    <script src="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/molstar@${version}/build/mvs-stories/mvs-stories.css" />
</head>
<body>
    <div id="viewer">
        <mvs-stories-viewer></mvs-stories-viewer>
    </div>
    <div id="controls">
        <mvs-stories-snapshot-markdown style="flex-grow: 1;"></ mvs-stories-snapshot-markdown>
    </div>

    <script>
        var mvsData = ${state};

        mvsStories.loadFromData(mvsData, { format: '${format}' });
    </script>
</body>
</html>`;
}
