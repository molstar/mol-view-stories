'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import {
  clearMonacoEditHistory,
  setupMonacoCodeCompletion,
  defaultCodeEditorOptions,
  MVSTypes,
} from '@mol-view-stories/lib';

export interface SceneCodeEditorProps {
  /** Current JavaScript code value (controlled) */
  value: string;
  /** Common/story-level JavaScript for IntelliSense */
  commonCode?: string;
  /** Callback when code changes (on every keystroke) */
  onChange?: (value: string) => void;
  /** Callback when code is saved (on blur or keyboard shortcut) */
  onSave?: (value: string) => void;
  /** Additional CSS class name */
  className?: string;
}

export function SceneCodeEditor({ value, commonCode, onChange, onSave, className }: SceneCodeEditorProps) {
  const [currentCode, setCurrentCode] = useState(value);
  const parentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Sync value changes from parent
  useEffect(() => {
    setCurrentCode(value);
    clearMonacoEditHistory(editorRef.current);
  }, [value]);

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

  const handleSave = () => {
    if (onSave && editorRef.current) {
      onSave(editorRef.current.getValue());
    }
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setupMonacoCodeCompletion(monacoInstance, MVSTypes, commonCode);

    editor.layout();

    // Add keyboard shortcuts for saving
    for (const command of [
      monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyS,
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Enter,
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
    ]) {
      editor.addCommand(command, handleSave);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setCurrentCode(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={className || 'absolute inset-0'} ref={parentRef}>
      <Editor
        height='100%'
        width='100%'
        language='javascript'
        value={currentCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={defaultCodeEditorOptions}
      />
    </div>
  );
}
