"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useAtom } from "jotai";
import { 
  ScenesAtom, 
  ActiveSceneIdAtom, 
  CurrentMvsDataAtom,
  getActiveScene,
  executeCode 
} from "../appstate";

export function MonacoEditorJS() {
  const [scenes, setScenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setCurrentMvsData] = useAtom(CurrentMvsDataAtom);

  const [currentCode, setCurrentCode] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const activeScene = getActiveScene(scenes, activeSceneId);

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentCode(activeScene.javascript);
    }
  }, [activeScene]);

  const handleCodeChange = (newCode: string | undefined) => {
    setCurrentCode(newCode || "");
  };

  const handleExecute = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    try {
      await executeCode(currentCode, setCurrentMvsData);
    } catch (error) {
      console.error("Error executing code:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = async () => {
    if (!activeScene) return;
    
    const updatedScenes = scenes.map((scene) =>
      scene.id === activeScene.id ? { ...scene, javascript: currentCode } : scene
    );
    setScenes(updatedScenes);

    if (activeScene.id === activeSceneId) {
      await executeCode(currentCode, setCurrentMvsData);
    }
  };

  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    const editorInstance = editor as { addCommand: (keybinding: number, handler: () => void) => void };
    const monacoInstance = monaco as { KeyMod: { Alt: number }; KeyCode: { Enter: number } };
    
    // Add Alt+Enter keyboard shortcut for code execution
    editorInstance.addCommand(monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Enter, () => {
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
            disabled={isExecuting}
            className={`px-3 py-1 text-sm rounded ${
              isExecuting
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isExecuting ? "Executing..." : "Execute"}
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