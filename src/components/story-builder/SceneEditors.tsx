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
import { Edit } from "lucide-react";
import { MonacoEditorJS } from "./editors/MonacoEditor";
import { MonacoMarkdownEditor } from "./editors/MonacoMarkdownEditor";

export function SceneEditors() {
  return (
    <Tabs defaultValue="javascript" className="w-full">
      <Card className="w-full">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <CardTitle className="text-sm text-muted-foreground">Scene Editor</CardTitle>
            </div>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
          </div>

        </CardHeader>
        <CardContent>
          <TabsContent value="markdown" className="mt-0">
            <MonacoMarkdownEditor />
          </TabsContent>
          <TabsContent value="javascript" className="mt-0">
            <MonacoEditorJS />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
