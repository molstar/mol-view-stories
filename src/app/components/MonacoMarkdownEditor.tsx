"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  getActiveScene,
} from "../appstate";

export function MonacoMarkdownEditor() {
  const [scenes, setScenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  
  const [currentMarkdown, setCurrentMarkdown] = useState("");

  const activeScene = getActiveScene(scenes, activeSceneId);

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentMarkdown(activeScene.description);
    }
  }, [activeScene]);

  const handleMarkdownChange = (newMarkdown: string | undefined) => {
    setCurrentMarkdown(newMarkdown || "");
  };

  const handleSave = async () => {
    if (!activeScene) return;
    
    const updatedScenes = scenes.map((scene) =>
      scene.id === activeScene.id ? { ...scene, description: currentMarkdown } : scene
    );
    setScenes(updatedScenes);
  };

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    const editorInstance = editor as { addCommand: (keybinding: number, handler: () => void) => void };
    const monacoInstance = monaco as { KeyMod: { Alt: number }; KeyCode: { KeyS: number } };
    
    // Add Alt+S keyboard shortcut for saving markdown
    editorInstance.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyS, () => {
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