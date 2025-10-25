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

export function clearMonacoEditHistory(editor?: monaco.editor.IStandaloneCodeEditor | null) {
  if (!editor) return;

  const model = editor.getModel();
  if (model) {
    // Push a stack element to separate before/after
    model.pushStackElement();
    // Clear the entire edit history
    const range = model.getFullModelRange();
    model.pushEditOperations(
      [],
      [{
        range: range,
        text: model.getValue(),
        forceMoveMarkers: true
      }],
      () => null
    );
    model.pushStackElement();
  }
}