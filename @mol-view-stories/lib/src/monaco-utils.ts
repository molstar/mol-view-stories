/**
 * Monaco Editor utilities for Mol-View-Stories
 * Framework-agnostic configuration for TypeScript/JavaScript editors
 *
 * @module monaco-utils
 */

/**
 * Monaco instance interface (compatible with monaco-editor and @monaco-editor/react)
 */
export interface MonacoInstance {
  languages: {
    typescript: {
      javascriptDefaults: {
        setEagerModelSync(value: boolean): void;
        getExtraLibs(): Record<string, any>;
        addExtraLib(content: string, filePath: string): void;
        setCompilerOptions(options: any): void;
      };
      ScriptTarget: any;
      ModuleResolutionKind: any;
      ModuleKind: any;
      JsxEmit: any;
    };
  };
}

/**
 * Monaco editor instance interface
 */
export interface MonacoEditor {
  getModel(): MonacoEditorModel | null;
}

/**
 * Monaco editor model interface
 */
export interface MonacoEditorModel {
  pushStackElement(): void;
  _commandManager?: {
    clear?: () => void;
  };
}

/**
 * Configure Monaco for MVS JavaScript code completion
 *
 * Sets up TypeScript/JavaScript IntelliSense with:
 * - Eager model synchronization for faster completions
 * - ES2020 target and ESNext modules
 * - Proper compiler options for JavaScript editing
 * - Optional MVS type definitions and common code
 *
 * @param monaco - Monaco instance from @monaco-editor/react or monaco-editor
 * @param mvsTypes - Optional MVS type definitions string (from mvs-types.ts)
 * @param commonCode - Optional common JavaScript code to include in IntelliSense
 *
 * @example
 * ```typescript
 * import { setupMonacoCodeCompletion, MVSTypes } from '@mol-view-stories/lib';
 *
 * // In Monaco onMount callback
 * setupMonacoCodeCompletion(monaco, MVSTypes, storyJavaScript);
 * ```
 */
export function setupMonacoCodeCompletion(
  monaco: MonacoInstance,
  mvsTypes?: string,
  commonCode?: string
): void {
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

  const extraLibs = monaco.languages.typescript.javascriptDefaults.getExtraLibs();

  // Add MVS types if provided and not already added
  if (mvsTypes && !('ts:mvs.d.ts' in extraLibs)) {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(mvsTypes, 'ts:mvs.d.ts');
  }

  // Add common code if provided
  if (commonCode) {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(commonCode, 'js:common-code.js');
  }

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    disableSizeLimit: true,
    noErrorTruncation: true,
    jsx: monaco.languages.typescript.JsxEmit.None,
    allowJs: true,
    skipLibCheck: true,
    typeRoots: [],
    lib: ['es2020'],
  });
}

/**
 * Clear Monaco editor's undo/redo history
 *
 * Useful when switching between scenes to avoid confusing edit history.
 * Uses internal Monaco API to clear the command manager.
 *
 * @param editor - Monaco editor instance (optional, does nothing if not provided)
 *
 * @example
 * ```typescript
 * import { clearMonacoEditHistory } from '@mol-view-stories/lib';
 *
 * // When switching scenes
 * useEffect(() => {
 *   clearMonacoEditHistory(editorRef.current);
 * }, [activeSceneId]);
 * ```
 */
export async function clearMonacoEditHistory(editor?: MonacoEditor | null): Promise<void> {
  if (!editor) return;

  // Wait for next tick to ensure editor is fully updated
  await new Promise((resolve) => setTimeout(resolve, 0));

  const model = editor.getModel();
  if (model) {
    // Use internal method to clear undo/redo stacks
    model._commandManager?.clear?.();
    // Alternative approach using pushStackElement to reset
    model.pushStackElement();
  }
}

/**
 * Default Monaco editor options for MVS code editors (JavaScript/TypeScript)
 *
 * Provides sensible defaults for editing MVS JavaScript code:
 * - Light theme
 * - Monospace font
 * - No minimap (more space for code)
 * - Word wrap enabled
 * - Format on paste
 * - Code completion and suggestions
 */
export const defaultCodeEditorOptions = {
  theme: 'vs',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
  lineNumbers: 'on' as const,
  wordWrap: 'on' as const,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: false,
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on' as const,
  snippetSuggestions: 'inline' as const,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
};

/**
 * Default Monaco editor options for MVS markdown editors
 *
 * Provides sensible defaults for editing markdown descriptions:
 * - Light theme
 * - Monospace font
 * - No minimap
 * - Word wrap enabled
 * - Automatic layout (adjusts to container size)
 */
export const defaultMarkdownEditorOptions = {
  theme: 'vs',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  automaticLayout: true,
};
