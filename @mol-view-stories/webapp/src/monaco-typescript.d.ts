// Monaco 0.56 exposes this runtime entry without a matching declaration file.
// Reuse the public API's type for the same language-service defaults instance.
declare module 'monaco-editor/language/typescript/monaco.contribution.js' {
  export const javascriptDefaults: typeof import('monaco-editor').typescript.javascriptDefaults;
}
