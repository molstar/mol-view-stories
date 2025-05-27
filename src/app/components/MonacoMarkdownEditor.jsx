"use client";

import React, { useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import {
  CurrentMarkdownAtom,
  UpdateMarkdownAtom,
  SaveMarkdownToSceneAtom,
  InitializeMarkdownEditorAtom,
  ActiveSceneMarkdownAtom,
} from "../appstate";

export function MonacoMarkdownEditor() {
  const [currentMarkdown] = useAtom(CurrentMarkdownAtom);
  const [activeSceneMarkdown] = useAtom(ActiveSceneMarkdownAtom);
  const [, updateMarkdown] = useAtom(UpdateMarkdownAtom);
  const [, saveMarkdown] = useAtom(SaveMarkdownToSceneAtom);
  const [, initializeMarkdownEditor] = useAtom(InitializeMarkdownEditorAtom);

  // Initialize editor when component mounts
  useEffect(() => {
    initializeMarkdownEditor();
  }, [initializeMarkdownEditor]);

  // Sync editor with active scene markdown changes (only when scene changes, not when user types)
  useEffect(() => {
    updateMarkdown(activeSceneMarkdown);
  }, [activeSceneMarkdown, updateMarkdown]);

  const handleMarkdownChange = (newMarkdown) => {
    updateMarkdown(newMarkdown || "");
  };

  const handleSave = () => {
    saveMarkdown();
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
        <div className="text-sm text-gray-600">
          Markdown Editor
        </div>
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