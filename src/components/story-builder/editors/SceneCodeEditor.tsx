'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ActiveSceneAtom, modifyCurrentScene } from '@/app/appstate';
import { setupMonacoCodeCompletion } from './common';

export function SceneCodeEditor() {
  const activeScene = useAtomValue(ActiveSceneAtom);
  const [currentCode, setCurrentCode] = useState('');

  const parentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentCode(activeScene.javascript || '');
    }
  }, [activeScene]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    if (parentRef.current) {
      observer.observe(parentRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSave = (value: string) => {
    if (!activeScene) return;

    modifyCurrentScene({
      javascript: value,
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    for (const command of [
      monaco.KeyMod.Alt | monaco.KeyCode.KeyS,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      monaco.KeyMod.Alt | monaco.KeyCode.Enter,
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    ]) {
      editor.addCommand(command, () => {
        handleSave(editor.getValue());
      });
    }

    setupMonacoCodeCompletion(monaco);
    editor.layout();
  };

  const handleEditorChange = (value: string | undefined) => {
    setCurrentCode(value || '');
  };

  return (
    <div className='absolute inset-0' ref={parentRef}>
      <Editor
        height='100%'
        width='100%'
        language='javascript'
        value={currentCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          theme: 'vs',
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
          lineNumbers: 'on',
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: false,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'inline',
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
