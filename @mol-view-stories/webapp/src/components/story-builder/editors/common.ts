import { Monaco } from '@monaco-editor/react';
import { MVSTypes } from './mvs-typing';
import * as monaco from 'monaco-editor';

export function setupMonacoCodeCompletion(monaco: Monaco) {
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  const extraLibs = monaco.languages.typescript.javascriptDefaults.getExtraLibs();
  if (!('ts:mvs.d.ts' in extraLibs)) {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(MVSTypes, 'ts:mvs.d.ts');
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

export async function clearMonacoEditHistory(editor?: monaco.editor.IStandaloneCodeEditor | null) {
  if (!editor) return;

  await new Promise((resolve) => setTimeout(resolve, 0));
  const model = editor.getModel();
  if (model) {
    // Use the internal method to clear undo/redo stacks
    (model as { _commandManager?: { clear?: () => void } })._commandManager?.clear?.();
    // Alternative approach using pushStackElement to reset
    model.pushStackElement();
  }
}
