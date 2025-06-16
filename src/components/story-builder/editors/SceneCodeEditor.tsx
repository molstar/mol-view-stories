'use client';

import React from 'react';
import { BaseMonacoEditor } from './BaseMonacoEditor';

export function SceneCodeEditor() {
  return (
    <BaseMonacoEditor
      language='javascript' // should this be "typescript"?
      fieldName='javascript'
      executeButtonText='Execute'
    />
  );
}
