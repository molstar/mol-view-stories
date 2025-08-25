'use client';

import { StoryAtom } from '@/app/appstate';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { setupMonacoCodeCompletion } from './common';

export function StoryCodeEditor() {
  const [story, setStory] = useAtom(StoryAtom);
  const [currentCode, setCurrentCode] = useState<string | undefined>('');

  const parentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  // Sync with active scene when it changes
  useEffect(() => {
    setCurrentCode(story.javascript || '');
  }, [story.javascript]);

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

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setupMonacoCodeCompletion(monaco);
    editor.layout();

    // Add Alt+S keyboard shortcut for saving markdown
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
      setStory((prev) => ({ ...prev, javascript: editor.getValue() }));
    });
    // TODO: does this need to be disposed?
    editor.onDidBlurEditorWidget(() => {
      setStory((prev) => ({ ...prev, javascript: editor.getValue() }));
    });
  };

  return (
    <div className='absolute inset-0' ref={parentRef}>
      <Editor
        height='100%'
        width='100%'
        language='javascript'
        value={currentCode}
        onChange={setCurrentCode}
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
