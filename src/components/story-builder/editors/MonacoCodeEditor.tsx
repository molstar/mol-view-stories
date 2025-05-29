'use client';

import React from 'react';
import { BaseMonacoEditor } from './BaseMonacoEditor';
import { modifyCurrentScene } from '@/app/appstate';

export function MonacoEditorJS() {
  const handleExecute = async (javascript: string) => {
    modifyCurrentScene({ javascript });
  };

  return (
    <BaseMonacoEditor
      language='javascript' // should this be "typescript"?
      fieldName='javascript'
      onExecute={handleExecute}
      executeButtonText='Execute'
    />
  );
}
