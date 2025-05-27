import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/node_modules",
];

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*")].concat(PYODIDE_EXCLUDE),
        dest: "assets",
      },
    ],
  });
}

export default defineConfig({
  optimizeDeps: { 
    exclude: ["pyodide", "molstar"],
    include: ["monaco-editor/esm/vs/language/typescript/ts.worker", "monaco-editor/esm/vs/editor/editor.worker"]
  },
  plugins: [viteStaticCopyPyodide()],
  worker: {
    format: "es"
  },
  define: {
    // Add this section to provide a process.env shim
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
    global: "globalThis",
  },
  build: {
    lib: {
      entry: "src/main.mjs",
      name: "MolViewSpecLive",
      fileName: (format) => `molviewspeclive.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["molstar"],
      output: {
        // globals: {
        //   react: "React",
        //   "react-dom": "ReactDOM",
        // },
        exports: "named",
        extend: true,
        name: "MolViewSpecLive",
        inlineDynamicImports: true,
      },
    },
  },
});
