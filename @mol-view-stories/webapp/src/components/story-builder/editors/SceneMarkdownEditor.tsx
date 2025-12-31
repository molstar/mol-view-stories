'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { clearMonacoEditHistory, defaultMarkdownEditorOptions } from './common';

export interface SceneMarkdownEditorProps {
  /** Current markdown content value (controlled) */
  value: string;
  /** Callback when markdown changes (on every keystroke) */
  onChange?: (value: string) => void;
  /** Callback when markdown is saved (on blur or keyboard shortcut) */
  onSave?: (value: string) => void;
  /** Height of the editor */
  height?: string;
  /** Additional CSS class name */
  className?: string;
}

export function SceneMarkdownEditor({
  value,
  onChange,
  onSave,
  height = '500px',
  className,
}: SceneMarkdownEditorProps) {
  const [currentMarkdown, setCurrentMarkdown] = useState(value);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Sync value changes from parent
  useEffect(() => {
    setCurrentMarkdown(value);
    clearMonacoEditHistory(editorRef.current);
  }, [value]);

  const handleMarkdownChange: OnChange = (newMarkdown) => {
    const newValue = newMarkdown || '';
    setCurrentMarkdown(newValue);
    onChange?.(newValue);
  };

  const handleSave = () => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.getValue());
    }
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Add keyboard shortcuts for saving
    for (const cmd of [
      monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyS,
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Enter,
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
    ]) {
      editor.addCommand(cmd, handleSave);
    }
  };

  return (
    <div className={className}>
      <Editor
        height={height}
        defaultLanguage='markdown'
        value={currentMarkdown}
        onChange={handleMarkdownChange}
        onMount={handleEditorDidMount}
        options={defaultMarkdownEditorOptions}
      />
    </div>
  );
}
