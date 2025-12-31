import { Monaco } from '@monaco-editor/react';
import {
  MVSTypes,
  setupMonacoCodeCompletion as setupFromLib,
  clearMonacoEditHistory as clearFromLib,
  defaultCodeEditorOptions as defaultCodeOptions,
  defaultMarkdownEditorOptions as defaultMarkdownOptions,
} from '@mol-view-stories/lib';

/**
 * Setup Monaco for MVS code completion (wrapper for library function)
 * @deprecated Import directly from '@mol-view-stories/lib' instead
 */
export function setupMonacoCodeCompletion(monaco: Monaco) {
  setupFromLib(monaco as any, MVSTypes);
}

/**
 * Clear Monaco edit history (wrapper for library function)
 * @deprecated Import directly from '@mol-view-stories/lib' instead
 */
export async function clearMonacoEditHistory(editor?: any) {
  return clearFromLib(editor);
}

// Re-export from library for backwards compatibility
export { defaultCodeOptions as defaultCodeEditorOptions, defaultMarkdownOptions as defaultMarkdownEditorOptions };
