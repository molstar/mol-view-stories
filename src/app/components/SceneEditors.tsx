"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { MonacoEditorJS } from "./MonacoEditor";
import { MonacoMarkdownEditor } from "./MonacoMarkdownEditor";

export function SceneEditors() {
  return (
    <div className="editor-section">
      <Tabs defaultValue="markdown" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent value="markdown">
          <MonacoMarkdownEditor />
        </TabsContent>
        <TabsContent value="javascript">
          <MonacoEditorJS />
        </TabsContent>
      </Tabs>
    </div>
  );
}