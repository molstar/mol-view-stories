'use client';

import { StoryAtom } from '@/app/appstate';
import Editor, { OnMount } from '@monaco-editor/react';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';

export function StoryCodeEditor() {
  const [story, setStory] = useAtom(StoryAtom);
  const [currentCode, setCurrentCode] = useState<string | undefined>('');

  // Sync with active scene when it changes
  useEffect(() => {
    setCurrentCode(story.javascript || '');
  }, [story.javascript]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
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
    <Editor
      height='500px'
      defaultLanguage='javascript'
      value={currentCode}
      onChange={setCurrentCode}
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
