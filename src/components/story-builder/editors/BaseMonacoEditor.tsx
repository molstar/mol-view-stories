'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { ActiveSceneAtom, modifyCurrentScene } from '@/app/appstate';

interface BaseMonacoEditorProps {
  language: string;
  fieldName: keyof { javascript: string; description: string };
  onExecute?: (code: string) => Promise<void>;
  executeButtonText?: string;
}

export function BaseMonacoEditor({ language, fieldName, onExecute }: BaseMonacoEditorProps) {
  const activeScene = useAtomValue(ActiveSceneAtom);
  const [currentCode, setCurrentCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

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

  const handleExecute = async (editorCode: string) => {
    // NOTE: save currently behaves same as execute

    if (!onExecute || isExecuting) return;

    // Get the current code from the editor directly to ensure we have the latest value

    // console.log("Executing code:", {
    //   currentCode: currentCode.length,
    //   editorCode: editorCode.length,
    //   actualCode: editorCode.substring(0, 100) + (editorCode.length > 100 ? "..." : "")
    // });

    // Note: this should not needed
    setIsExecuting(true);
    try {
      await onExecute(editorCode);
    } catch (error) {
      console.error('Execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add save keyboard shortcut (Alt+S)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () => {
      handleSave(editor.getValue());
    });

    // Add execute keyboard shortcut if onExecute is provided
    if (onExecute) {
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
        console.log('Alt+Enter pressed, executing code');
        handleExecute(editor.getValue());
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
