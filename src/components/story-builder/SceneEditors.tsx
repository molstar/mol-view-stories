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
    <Tabs defaultValue="markdown" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent value="markdown">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Editor</CardTitle>
              <CardDescription>
                Write your story content in Markdown format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonacoMarkdownEditor />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="javascript">
          <Card>
            <CardHeader>
              <CardTitle>JavaScript Editor</CardTitle>
              <CardDescription>
                Add interactive functionality and logic to your story.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonacoEditorJS />
            </CardContent>
          </Card>
        </TabsContent>
    </Tabs>
  );
}