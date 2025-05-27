"use client";

import React, { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import {
  CurrentCodeAtom,
  UpdateCurrentContentAtom,
  ExecuteCurrentCodeAtom,
  SaveCurrentContentToSceneAtom,
  InitializeEditorsAtom,
  ActiveSceneAtom,
} from "../appstate";

export function MonacoEditorJotai() {
  const [currentCode] = useAtom(CurrentCodeAtom);
  const [activeScene] = useAtom(ActiveSceneAtom);
  const [, updateContent] = useAtom(UpdateCurrentContentAtom);
  const [, executeCode] = useAtom(ExecuteCurrentCodeAtom);
  const [, saveContent] = useAtom(SaveCurrentContentToSceneAtom);
  const [, initializeEditors] = useAtom(InitializeEditorsAtom);

  // Initialize editor when component mounts
  useEffect(() => {
    initializeEditors();
  }, [initializeEditors]);

  // Sync editor with active scene code changes (only when scene changes, not when user types)
  useEffect(() => {
    updateContent({ code: activeScene.javascript });
  }, [activeScene.javascript, updateContent]);

  const handleCodeChange = (newCode) => {
    updateContent({ code: newCode || "" });
  };

  const handleExecute = () => {
    executeCode();
  };

  const handleSave = () => {
    saveContent("code");
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Add Alt+Enter keyboard shortcut for code execution
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      handleExecute();
    });
  };

  return (
    <div className="editor-container">
      <div className="flex justify-between items-center mb-2 p-2 bg-gray-50 border rounded">
        <div className="text-sm text-gray-600">JavaScript Editor</div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={handleExecute}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            Execute
          </button>
        </div>
      </div>
      <Editor
        height="400px"
        defaultLanguage="javascript"
        value={currentCode}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  );
}
