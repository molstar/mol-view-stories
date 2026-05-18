/**
 * Monaco's TypeScript language service (hover types, completions, diagnostics)
 * runs in a Web Worker to avoid blocking the main thread. Monaco delegates
 * worker location to a global `MonacoEnvironment.getWorker` hook that the host
 * application must provide.
 *
 * ## Before @molstar/molstar-components
 *
 * The editor was built on `@monaco-editor/react`, which uses `@monaco-editor/loader`
 * under the hood. That loader injected Monaco by appending a <script> tag pointing
 * to Monaco's AMD bundle on jsDelivr CDN:
 *
 *   https://cdn.jsdelivr.net/npm/monaco-editor@x.y.z/min/vs/loader.js
 *
 * Because that AMD loader fetches all Monaco modules — workers included — from
 * the same CDN origin at runtime, `MonacoEnvironment` never needed to be set
 * explicitly. The CDN URL was the implicit source for everything.
 *
 * Source: https://github.com/suren-atoyan/monaco-loader/blob/master/src/config/index.js
 *         https://github.com/suren-atoyan/monaco-loader/blob/master/src/loader/index.js
 *
 * ## Now
 *
 * `MolViewEditor` from @molstar/molstar-components imports `monaco-editor` as a
 * regular ESM package — no CDN involved. Webpack bundles the main Monaco code
 * but emits worker entry points as separate chunks via the `new URL(..., import.meta.url)`
 * pattern. Those chunks must be wired up at runtime through `MonacoEnvironment`.
 *
 * `MolViewEditor` ships a silent no-op fallback so it mounts without errors in
 * any environment, but TypeScript IntelliSense is disabled unless a real
 * `MonacoEnvironment` is set before the component mounts. That responsibility
 * falls to this app because `new URL('monaco-editor/esm/...', import.meta.url)`
 * must be processed by *this* app's bundler (webpack/Next.js), not the library's.
 *
 * This module must be imported before any component that mounts MolViewEditor.
 * Currently that is SceneEditor.tsx.
 */

export function setupMonacoWorkers(): void {
  if (typeof window !== 'undefined' && !(window as { MonacoEnvironment?: unknown }).MonacoEnvironment) {
    (window as Window & { MonacoEnvironment?: unknown }).MonacoEnvironment = {
      getWorker(_moduleId: string, label: string): Worker {
        if (label === 'typescript' || label === 'javascript') {
          return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url));
        }
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      },
    };
  }
}
