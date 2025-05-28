"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import { ScenesAtom, ActiveSceneIdAtom, getActiveScene } from "../../../app/appstate";
import { Button } from "@/components/ui/button";

interface BaseMonacoEditorProps {
  language: string;
  fieldName: keyof { javascript: string; description: string };
  onExecute?: (code: string) => Promise<void>;
  executeButtonText?: string;
}

export function BaseMonacoEditor({
  language,
  fieldName,
  onExecute,
  executeButtonText = "Execute",
}: BaseMonacoEditorProps) {
  const [scenes, setScenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [currentCode, setCurrentCode] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const activeScene = getActiveScene(scenes, activeSceneId);

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentCode(activeScene[fieldName] || "");
    }
  }, [activeScene, fieldName]);

  const handleSave = () => {
    if (!activeScene) return;

    const updatedScenes = scenes.map((scene) => {
      if (scene.id === activeScene.id) {
        return {
          ...scene,
          [fieldName]: currentCode,
        };
      }
      return scene;
    });

    setScenes(updatedScenes);
  };

  const handleExecute = async () => {
    if (!onExecute || isExecuting) return;

    // Get the current code from the editor directly to ensure we have the latest value
    const editorCode = editorRef.current?.getValue() || currentCode;
    
    console.log("Executing code:", { 
      currentCode: currentCode.length, 
      editorCode: editorCode.length,
      actualCode: editorCode.substring(0, 100) + (editorCode.length > 100 ? "..." : "")
    });

    setIsExecuting(true);
    try {
      await onExecute(editorCode);
    } catch (error) {
      console.error("Execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add save keyboard shortcut (Alt+S)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Add execute keyboard shortcut if onExecute is provided
    if (onExecute) {
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
        console.log("Alt+Enter pressed, executing code");
        handleExecute();
      });
    }

    // Set up TypeScript/JavaScript configuration
    if (language === "javascript" || language === "typescript") {
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
      });

      // Add global type definitions for molstar
      const molstarTypes = `
        declare global {
          interface Window {
            molstar: any;
          }
          const molstar: any;
        }
      `;

      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        molstarTypes,
        "ts:molstar-globals.d.ts",
      );
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setCurrentCode(value || "");
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="500px"
        language={language}
        value={currentCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          theme: "vs",
          fontSize: 14,
          fontFamily: "Monaco, Menlo, Ubuntu Mono, Consolas, monospace",
          lineNumbers: "on",
          wordWrap: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "inline",
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
        }}
      />
    </div>
  );
}
