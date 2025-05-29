"use client";

import React from "react";
import { useStore } from "jotai";
import { BaseMonacoEditor } from "./BaseMonacoEditor";
import { modifyCurrentScene } from "@/app/appstate";

export function MonacoEditorJS() {
  const store = useStore();

  const handleExecute = async (javascript: string) => {
    modifyCurrentScene(store, { javascript });
  };

  return (
    <BaseMonacoEditor
      language="javascript"  // should this be "typescript"?
      fieldName="javascript"
      onExecute={handleExecute}
      executeButtonText="Execute"
    />
  );
}