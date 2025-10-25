'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getDefaultStore, useAtomValue, useStore } from 'jotai';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ActiveSceneAtom, modifyCurrentScene, StoryAtom } from '@/app/appstate';
import { clearMonacoEditHistory, setupMonacoCodeCompletion } from './common';
import { UpdateSceneAtom } from '@/app/state/atoms';

export function SceneCodeEditor() {
  const store = useStore();
  const activeScene = useAtomValue(ActiveSceneAtom);
  const [currentCode, setCurrentCode] = useState('');

  const parentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    if (parentRef.current) {
      observer.observe(parentRef.current);
    }

    const sub = store.sub(UpdateSceneAtom, () => {
      const ts = store.get(UpdateSceneAtom);
      if (!editorRef.current?.getValue() || !ts) return;
      modifyCurrentScene({ javascript: editorRef.current?.getValue() || '' });
    });

    return () => {
      observer.disconnect();
      sub();
    };
  }, [store]);

  const handleSave = (value: string) => {
    if (!activeScene) return;

    modifyCurrentScene({
      javascript: value,
    });
  };

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentCode(activeScene.javascript || '');
    }
    clearMonacoEditHistory(editorRef.current);
  }, [activeScene]);

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
    const commonCode = getDefaultStore().get(StoryAtom)?.javascript || '';
    monaco.languages.typescript.javascriptDefaults.addExtraLib(commonCode, 'js:common-code.js');
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
