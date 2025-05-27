"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import { useJSAtomScope } from "./atomScope.jsx";
import { MolStar } from "./MolStar.jsx";
import { AutoTypings, LocalStorageCache } from "monaco-editor-auto-typings";
import { MONACO_CONFIG } from "./monaco-config.js";

// Monaco setup hook that combines language and editor setup
function useMonacoSetup(monacoInstance, editorInstance, executeJsCode) {
  useEffect(() => {
    if (!monacoInstance) return;

    // Language setup
    const jsDefaults = monacoInstance.languages.typescript.javascriptDefaults;
    const typescript = monacoInstance.languages.typescript;

    // Set compiler options using config directly
    jsDefaults.setCompilerOptions({
      target: typescript.ScriptTarget[MONACO_CONFIG.compilerOptions.target],
      allowNonTsExtensions: MONACO_CONFIG.compilerOptions.allowNonTsExtensions,
      moduleResolution:
        typescript.ModuleResolutionKind[
          MONACO_CONFIG.compilerOptions.moduleResolution
        ],
      module: typescript.ModuleKind[MONACO_CONFIG.compilerOptions.module],
      noEmit: MONACO_CONFIG.compilerOptions.noEmit,
      allowSyntheticDefaultImports:
        MONACO_CONFIG.compilerOptions.allowSyntheticDefaultImports,
      typeRoots: MONACO_CONFIG.compilerOptions.typeRoots,
    });

    // Add type definitions
    jsDefaults.addExtraLib(MONACO_CONFIG.molstarTypeDefs, "molstar-mvs.d.ts");

    // Register providers
    const completionProvider =
      monacoInstance.languages.registerCompletionItemProvider("typescript", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          return {
            suggestions: MONACO_CONFIG.snippets.map((snippet) => ({
              label: snippet.label,
              kind: monacoInstance.languages.CompletionItemKind[snippet.kind],
              insertText: snippet.insertText,
              insertTextRules:
                monacoInstance.languages.CompletionItemInsertTextRule
                  .InsertAsSnippet,
              documentation: snippet.documentation,
              range,
            })),
          };
        },
      });

    const hoverProvider = monacoInstance.languages.registerHoverProvider(
      "typescript",
      {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word || !MONACO_CONFIG.hoverDocs[word.word]) return;

          return {
            range: new monacoInstance.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn,
            ),
            contents: [
              { value: `**${word.word}**` },
              { value: MONACO_CONFIG.hoverDocs[word.word] },
            ],
          };
        },
      },
    );

    return () => {
      completionProvider?.dispose();
      hoverProvider?.dispose();
    };
  }, [monacoInstance]);

  // Editor setup (keyboard shortcuts and auto-typings)
  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;

    // Keyboard shortcut
    const shortcutDisposable = editorInstance.addCommand(
      monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Enter,
      executeJsCode,
    );

    // Auto-typings
    let mounted = true;
    AutoTypings.create(editorInstance, {
      sourceCache: new LocalStorageCache(),
      monaco: monacoInstance,
      ...MONACO_CONFIG.autoTypingsConfig,
    }).catch((error) => {
      if (mounted) console.warn("Failed to initialize auto-typings:", error);
    });

    return () => {
      mounted = false;
      shortcutDisposable?.dispose();
    };
  }, [editorInstance, monacoInstance, executeJsCode]);
}

export function MonacoEditor({ initialCode = "" }) {
  const atomScope = useJSAtomScope();
  const [code, setCode] = useAtom(atomScope.codeAtom);
  const [molstarReady] = useAtom(atomScope.molstarReadyAtom);
  const [, executeJsCode] = useAtom(atomScope.executeJsCodeAtom);
  const [, initializeMolstar] = useAtom(atomScope.initializeMolstarAtom);
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);

  // Combined Monaco setup
  useMonacoSetup(monacoInstance, editorInstance, executeJsCode);

  // Simplified initialization - run once on mount
  useEffect(() => {
    if (initialCode && !code) {
      setCode(initialCode);
    }
    initializeMolstar();
  }, []); // Remove dependencies since this should only run once

  // Auto-execute when ready
  useEffect(() => {
    if (molstarReady && code) {
      executeJsCode();
    }
  }, [molstarReady, code, executeJsCode]);

  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
  };

  return (
    <div className="app-container">
      <div className="editor-container">
        <Editor
          defaultLanguage="javascript"
          value={code || initialCode}
          onChange={setCode} // Simplified - no need for wrapper function
          onMount={handleEditorDidMount}
          theme={MONACO_CONFIG.editorOptions.theme}
          options={MONACO_CONFIG.editorOptions}
        />
      </div>
      <div className="visualization-container">
        {!molstarReady && <div className="loading">Loading Molstar...</div>}
        <MolStar />
      </div>
    </div>
  );
}
