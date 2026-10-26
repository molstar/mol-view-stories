import { assertEquals } from '@std/assert';
import { setupMonacoCodeCompletion, type MonacoInstance } from '@mol-view-stories/lib/monaco-utils.ts';

Deno.test('Monaco replaces bundled or regenerated MVS typings without duplicate registration', () => {
  const libs: Record<string, { content: string }> = {
    'ts:mvs.d.ts': { content: 'old component typings' },
    'js:common-code.js': { content: 'const shared = 1;' },
  };
  let registrations = 0;
  const monaco: MonacoInstance = {
    languages: {
      typescript: {
        javascriptDefaults: {
          getExtraLibs: () => libs,
          addExtraLib(content, path) {
            libs[path] = { content };
            registrations++;
          },
          setEagerModelSync() {},
          setCompilerOptions() {},
          setDiagnosticsOptions() {},
        },
        ScriptTarget: {},
        ModuleResolutionKind: {},
        ModuleKind: {},
        JsxEmit: {},
      },
    },
  };

  setupMonacoCodeCompletion(monaco, 'updated typings');
  assertEquals(libs['ts:mvs.d.ts'].content, 'updated typings');
  setupMonacoCodeCompletion(monaco, 'updated typings');
  assertEquals(registrations, 1);
  setupMonacoCodeCompletion(monaco, 'regenerated typings');
  assertEquals(libs['ts:mvs.d.ts'].content, 'regenerated typings');
  assertEquals(libs['js:common-code.js'].content, 'const shared = 1;');
  assertEquals(registrations, 2);
});
