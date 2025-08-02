import { Monaco } from '@monaco-editor/react';
import { MVSTypes } from './mvs-typing';

export function setupMonacoCodeCompletion(monaco: Monaco) {
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  monaco.languages.typescript.javascriptDefaults.addExtraLib(MVSTypes, 'ts:mvs.d.ts');
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
