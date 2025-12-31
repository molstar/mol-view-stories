'use client';

import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';
import { setupMonacoCodeCompletion, defaultCodeEditorOptions } from './common';

export interface StoryCodeEditorProps {
  /** Current JavaScript code value (controlled) */
  value: string;
  /** Callback when code changes (on every keystroke) */
  onChange?: (value: string) => void;
  /** Callback when code is saved (on blur or keyboard shortcut) */
  onSave?: (value: string) => void;
  /** Additional CSS class name */
  className?: string;
}

export function StoryCodeEditor({ value, onChange, onSave, className }: StoryCodeEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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

    // Add keyboard shortcuts for saving
    if (onSave) {
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
        onSave(editor.getValue());
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave(editor.getValue());
      });
    }

    // Save on blur
    if (onSave) {
      editor.onDidBlurEditorWidget(() => {
        onSave(editor.getValue());
      });
    }
  };

  return (
    <div className={className || 'absolute inset-0'} ref={parentRef}>
      <Editor
        height='100%'
        width='100%'
        language='javascript'
        value={value}
        onChange={(v) => onChange?.(v || '')}
        onMount={handleEditorDidMount}
        options={defaultCodeEditorOptions}
      />
    </div>
  );
}
