'use client';

import React, { useState, useEffect } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import { useAtomValue } from 'jotai';
import { ActiveSceneAtom, modifyCurrentScene } from '@/app/appstate';

export function SceneMarkdownEditor() {
  const activeScene = useAtomValue(ActiveSceneAtom);
  const [currentMarkdown, setCurrentMarkdown] = useState('');

  // Sync with active scene when it changes
  useEffect(() => {
    setCurrentMarkdown(activeScene?.description || '');
  }, [activeScene?.description]);

  const handleMarkdownChange: OnChange = (newMarkdown) => {
    setCurrentMarkdown(newMarkdown || '');
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Add Alt+S keyboard shortcut for saving markdown
    for (const cmd of [
      monaco.KeyMod.Alt | monaco.KeyCode.KeyS,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      monaco.KeyMod.Alt | monaco.KeyCode.Enter,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    ]) {
      editor.addCommand(cmd, () => {
        modifyCurrentScene({ description: editor.getValue() });
      });
    }
  };

  return (
    <Editor
      height='500px'
      defaultLanguage='markdown'
      value={currentMarkdown}
      onChange={handleMarkdownChange}
      onMount={handleEditorDidMount}
      theme='vs-light'
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
}
