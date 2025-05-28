"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonacoEditorJS } from "./editors/MonacoEditor";
import { MonacoMarkdownEditor } from "./editors/MonacoMarkdownEditor";

export function SceneEditors() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scene Editor</CardTitle>
        <CardDescription>
          Edit your story content using Markdown or add interactive functionality with JavaScript.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="javascript" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          </TabsList>
          <TabsContent value="markdown" className="mt-4">
            <MonacoMarkdownEditor />
          </TabsContent>
          <TabsContent value="javascript" className="mt-4">
            <MonacoEditorJS />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
