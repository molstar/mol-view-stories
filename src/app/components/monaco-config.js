/**
 * Monaco Editor Configuration
 * Centralized configuration for Monaco Editor with Molstar MVSData support
 */

export const MONACO_CONFIG = {
  // Editor options
  editorOptions: {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    fontSize: 14,
    lineNumbers: "on",
    roundedSelection: false,
    automaticLayout: true,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showProperties: true,
      showMethods: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: {
      enabled: true,
    },
    hover: {
      enabled: true,
    },
    theme: "vs-light",
  },

  // TypeScript compiler options
  compilerOptions: {
    target: "ES2020",
    allowNonTsExtensions: true,
    moduleResolution: "NodeJs",
    module: "CommonJS",
    noEmit: true,
    allowSyntheticDefaultImports: true,
    typeRoots: ["node_modules/@types"],
  },

  // Auto-typings configuration
  autoTypingsConfig: {
    shareCache: true,
    onlySpecifiedPackages: false,
    debounceDuration: 1000,
    packageRecursionDepth: 3,
    fileRecursionDepth: 10,
  },

  // Molstar type definitions
  molstarTypeDefs: `
    declare global {
      interface Window {
        molstar: {
          PluginExtensions: {
            mvs: {
              MVSData: {
                createBuilder(): MVSDataBuilder;
              };
            };
          };
        };
      }
    }

    interface MVSDataBuilder {
      download(options: DownloadOptions): StructureBuilder;
      getState(): any;
    }

    interface DownloadOptions {
      url: string;
      format?: string;
      label?: string;
    }

    interface StructureBuilder {
      parse(options: ParseOptions): ModelStructureBuilder;
    }

    interface ParseOptions {
      format: 'mmcif' | 'pdb' | 'bcif' | 'mol' | 'sdf';
      label?: string;
    }

    interface ModelStructureBuilder {
      modelStructure(options?: ModelStructureOptions): ComponentBuilder;
    }

    interface ModelStructureOptions {
      modelIndex?: number;
      blockIndex?: number;
      label?: string;
    }

    interface ComponentBuilder {
      component(options?: ComponentOptions): RepresentationBuilder;
    }

    interface ComponentOptions {
      selector?: 'all' | 'polymer' | 'protein' | 'nucleic' | 'branched' | 'ligand' | 'ion' | 'water' | string;
      label?: string;
      expression?: string;
    }

    interface RepresentationBuilder {
      representation(options?: RepresentationOptions): ColorBuilder;
      label(options: LabelOptions): RepresentationBuilder;
      focus(options?: FocusOptions): RepresentationBuilder;
      tooltip(options: TooltipOptions): RepresentationBuilder;
    }

    interface RepresentationOptions {
      type?: 'cartoon' | 'ball_and_stick' | 'spacefill' | 'surface' | 'tube' | 'ribbon' | 'putty' | 'point' | 'ellipsoid' | 'gaussian_surface';
      params?: Record<string, any>;
      label?: string;
    }

    interface ColorBuilder {
      color(options: ColorOptions): RepresentationBuilder;
    }

    interface ColorOptions {
      color?: string | number;
      theme?: 'element-symbol' | 'chain-id' | 'entity-id' | 'model-index' | 'residue-name' | 'secondary-structure' | 'uniform';
      custom?: {
        molstar_color_theme_name?: string;
      };
      label?: string;
    }

    interface LabelOptions {
      text: string;
      params?: Record<string, any>;
    }

    interface FocusOptions {
      direction?: [number, number, number];
      up?: [number, number, number];
      label?: string;
    }

    interface TooltipOptions {
      text: string;
      params?: Record<string, any>;
    }

    declare const molstar: Window['molstar'];
  `,

  // Code snippets
  snippets: [
    {
      label: 'mvs-basic-protein',
      kind: 'Snippet',
      insertText: [
        '// Create a basic protein visualization',
        'const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();',
        '',
        'const structure = builder',
        '    .download({ url: "${1:https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif}" })',
        '    .parse({ format: "${2:bcif}" })',
        '    .modelStructure({});',
        '',
        '// Add protein representation',
        'structure',
        '    .component({ selector: "protein" })',
        '    .representation({ type: "cartoon" })',
        '    .color({ color: "${3:#4a90e2}" });',
        '',
        '// Add ligand representation',
        'structure',
        '    .component({ selector: "ligand" })',
        '    .representation({ type: "ball_and_stick" })',
        '    .color({ color: "${4:#cc3399}" });',
        '',
        'const mvsData = builder.getState();'
      ].join('\n'),
      documentation: 'Creates a basic protein visualization with cartoon protein and ball-and-stick ligands'
    },
    {
      label: 'mvs-chain-colors',
      kind: 'Snippet',
      insertText: [
        '// Create a chain-colored visualization',
        'const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();',
        '',
        'const structure = builder',
        '    .download({ url: "${1:https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif}" })',
        '    .parse({ format: "${2:bcif}" })',
        '    .modelStructure({});',
        '',
        'structure',
        '    .component({ selector: "polymer" })',
        '    .representation({ type: "${3:cartoon}" })',
        '    .color({ theme: "chain-id" });',
        '',
        'const mvsData = builder.getState();'
      ].join('\n'),
      documentation: 'Creates a visualization colored by chain ID'
    },
    {
      label: 'mvs-surface',
      kind: 'Snippet',
      insertText: [
        '// Create a surface visualization',
        'const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();',
        '',
        'const structure = builder',
        '    .download({ url: "${1:https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif}" })',
        '    .parse({ format: "${2:bcif}" })',
        '    .modelStructure({});',
        '',
        'structure',
        '    .component({ selector: "polymer" })',
        '    .representation({ ',
        '        type: "surface",',
        '        params: { alpha: ${3:0.7} }',
        '    })',
        '    .color({ color: "${4:#0000ff}" });',
        '',
        'const mvsData = builder.getState();'
      ].join('\n'),
      documentation: 'Creates a surface representation with transparency'
    },
    {
      label: 'mvs-focused-ligand',
      kind: 'Snippet',
      insertText: [
        '// Create a focused ligand visualization',
        'const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();',
        '',
        'const structure = builder',
        '    .download({ url: "${1:https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif}" })',
        '    .parse({ format: "${2:bcif}" })',
        '    .modelStructure({});',
        '',
        '// Add context protein',
        'structure',
        '    .component({ selector: "protein" })',
        '    .representation({ type: "cartoon" })',
        '    .color({ color: "${3:#4a90e2}" });',
        '',
        '// Add focused ligand',
        'structure',
        '    .component({ selector: "ligand" })',
        '    .label({ text: "${4:Ligand}" })',
        '    .focus({})',
        '    .representation({ type: "ball_and_stick" })',
        '    .color({ color: "${5:#cc3399}" });',
        '',
        'const mvsData = builder.getState();'
      ].join('\n'),
      documentation: 'Creates a visualization focused on a ligand with label'
    },
    {
      label: 'mvs-builder',
      kind: 'Snippet',
      insertText: [
        'const builder = molstar.PluginExtensions.mvs.MVSData.createBuilder();'
      ].join('\n'),
      documentation: 'Creates a new MVSData builder instance'
    }
  ],

  // Hover documentation
  hoverDocs: {
    'createBuilder': 'Creates a new MVSData builder for constructing molecular visualizations',
    'download': 'Downloads structure data from a URL. Supports PDB, mmCIF, and binary CIF formats',
    'parse': 'Parses the downloaded structure data into a format suitable for visualization',
    'modelStructure': 'Creates a model structure from the parsed data',
    'component': 'Selects a component of the structure (protein, ligand, etc.)',
    'representation': 'Adds a visual representation (cartoon, ball_and_stick, surface, etc.)',
    'color': 'Sets the color for the representation using color values or themes',
    'label': 'Adds a text label to the component',
    'focus': 'Centers the camera on the selected component',
    'getState': 'Returns the final MVS data structure for visualization'
  },

  // Keyboard shortcuts
  keyboardShortcuts: [
    {
      key: 'Alt+Enter',
      command: 'executeCode',
      description: 'Execute the current code'
    }
  ]
};

export default MONACO_CONFIG;