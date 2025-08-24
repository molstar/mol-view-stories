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

export interface MVSDataBuilder {
  /**
   * Download structure data from a URL
   */
  download(options: DownloadOptions): StructureBuilder;

  /**
   * Get the current state of the builder
   */
  getState(): unknown;
}

export interface DownloadOptions {
  /** URL to download the structure from */
  url: string;
  /** Optional format specification */
  format?: string;
  /** Optional label for the download */
  label?: string;
}

export interface StructureBuilder {
  /**
   * Parse the downloaded data
   */
  parse(options: ParseOptions): ModelStructureBuilder;
}

export interface ParseOptions {
  /** Format of the data (e.g., 'mmcif', 'pdb', 'bcif') */
  format: 'mmcif' | 'pdb' | 'bcif' | 'mol' | 'sdf';
  /** Optional label for parsing */
  label?: string;
}

export interface ModelStructureBuilder {
  /**
   * Create a model structure
   */
  modelStructure(options?: ModelStructureOptions): ComponentBuilder;
}

export interface ModelStructureOptions {
  /** Model index */
  modelIndex?: number;
  /** Block index */
  blockIndex?: number;
  /** Optional label */
  label?: string;
}

export interface ComponentBuilder {
  /**
   * Add a component to the structure
   */
  component(options?: ComponentOptions): RepresentationBuilder;
}

export interface ComponentOptions {
  /** Selector for the component */
  selector?: 'all' | 'polymer' | 'protein' | 'nucleic' | 'branched' | 'ligand' | 'ion' | 'water' | string;
  /** Optional label */
  label?: string;
  /** Custom selector expression */
  expression?: string;
}

export interface RepresentationBuilder {
  /**
   * Add a representation to the component
   */
  representation(options?: RepresentationOptions): ColorBuilder;

  /**
   * Add a label to the component
   */
  label(options: LabelOptions): RepresentationBuilder;

  /**
   * Focus on the component
   */
  focus(options?: FocusOptions): RepresentationBuilder;

  /**
   * Add tooltip to the component
   */
  tooltip(options: TooltipOptions): RepresentationBuilder;
}

export interface RepresentationOptions {
  /** Type of representation */
  type?:
    | 'cartoon'
    | 'ball_and_stick'
    | 'spacefill'
    | 'surface'
    | 'tube'
    | 'ribbon'
    | 'putty'
    | 'point'
    | 'ellipsoid'
    | 'gaussian_surface';
  /** Optional parameters for the representation */
  params?: Record<string, unknown>;
  /** Optional label */
  label?: string;
}

export interface ColorBuilder {
  /**
   * Set color for the representation
   */
  color(options: ColorOptions): RepresentationBuilder;
}

export interface ColorOptions {
  /** Static color */
  color?: string | number;
  /** Color theme */
  theme?:
    | 'element-symbol'
    | 'chain-id'
    | 'entity-id'
    | 'model-index'
    | 'residue-name'
    | 'secondary-structure'
    | 'uniform';
  /** Custom color theme name */
  custom?: {
    molstar_color_theme_name?: string;
  };
  /** Optional label */
  label?: string;
}

export interface LabelOptions {
  /** Text for the label */
  text: string;
  /** Optional label parameters */
  params?: Record<string, unknown>;
}

export interface FocusOptions {
  /** Focus direction */
  direction?: [number, number, number];
  /** Focus up vector */
  up?: [number, number, number];
  /** Optional label */
  label?: string;
}

export interface TooltipOptions {
  /** Tooltip text */
  text: string;
  /** Optional tooltip parameters */
  params?: Record<string, unknown>;
}

// Global molstar variable available in the browser
declare const molstar: Window['molstar'];
