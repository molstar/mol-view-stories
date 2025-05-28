"use client";

import React from "react";
import { useAtom } from "jotai";
import { CurrentMvsDataAtom, executeCode } from "../appstate";
import { BaseMonacoEditor } from "./BaseMonacoEditor";

export function MonacoEditorJS() {
  const [, setCurrentMvsData] = useAtom(CurrentMvsDataAtom);

  const handleExecute = async (code: string) => {
    await executeCode(code, setCurrentMvsData);
  };

  return (
    <BaseMonacoEditor
      language="javascript"
      fieldName="javascript"
      onExecute={handleExecute}
      executeButtonText="Execute"
    />
  );
}