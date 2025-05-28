"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import {
  ActiveSceneAtom,
  UpdateSceneAtom,
} from "../appstate";

export function MonacoMarkdownEditor() {
  const [activeScene] = useAtom(ActiveSceneAtom);
  const [, updateScene] = useAtom(UpdateSceneAtom);
  
  const [currentMarkdown, setCurrentMarkdown] = useState("");

  // Sync with active scene when it changes
  useEffect(() => {
    setCurrentMarkdown(activeScene.description);
  }, [activeScene.id, activeScene.description]);

  const handleMarkdownChange = (newMarkdown) => {
    setCurrentMarkdown(newMarkdown || "");
  };

  const handleSave = async () => {
    await updateScene(activeScene.id, { description: currentMarkdown });
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Add Alt+S keyboard shortcut for saving markdown
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  return (
    <div className="editor-container">
      <div className="flex justify-between items-center mb-2 p-2 bg-gray-50 border rounded">
        <div className="text-sm text-gray-600">Markdown Editor</div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
      <Editor
        height="400px"
        defaultLanguage="markdown"
        value={currentMarkdown}
        onChange={handleMarkdownChange}
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