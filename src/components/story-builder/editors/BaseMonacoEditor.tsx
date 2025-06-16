'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ActiveSceneAtom, modifyCurrentScene } from '@/app/appstate';

interface BaseMonacoEditorProps {
  language: string;
  fieldName: keyof { javascript: string; description: string };
  executeButtonText?: string;
}

export function BaseMonacoEditor({ language, fieldName }: BaseMonacoEditorProps) {
  const activeScene = useAtomValue(ActiveSceneAtom);
  const [currentCode, setCurrentCode] = useState('');

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
  const monacoRef = useRef<typeof monaco>(null);

  // Sync with active scene when it changes
  useEffect(() => {
    if (activeScene) {
      setCurrentCode(activeScene[fieldName] || '');
    }
  }, [activeScene, fieldName]);

  const handleSave = (value: string) => {
    if (!activeScene) return;

    modifyCurrentScene({
      [fieldName]: value,
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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

    // Set up TypeScript/JavaScript configuration
    if (language === 'javascript' || language === 'typescript') {
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
      });

      // Add global type definitions for molstar
      const molstarTypes = `
        declare global {
          interface Window {
            molstar: any;
          }
          const molstar: any;
        }
      `;

      monaco.languages.typescript.javascriptDefaults.addExtraLib(molstarTypes, 'ts:molstar-globals.d.ts');
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setCurrentCode(value || '');
  };

  return (
    <div className='h-full w-full'>
      <Editor
        height='500px'
        language={language}
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
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
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
