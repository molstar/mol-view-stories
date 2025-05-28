"use client";

import React from "react";
import { useAtom } from "jotai";
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
import { CameraControls } from "./CameraControls";
import { CameraPositionAtom } from "../../app/appstate";
import { CameraSnapshot } from "../../types/camera";

export function SceneEditors() {
  const [cameraSnapshot] = useAtom(CameraPositionAtom);

  return (
    <Tabs defaultValue="javascript" className="w-full h-full">
      <Card className="w-full h-full">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <CardTitle className="text-sm text-muted-foreground">Scene Editor</CardTitle>
            </div>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="camera">Camera</TabsTrigger>
            </TabsList>
          </div>

        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <TabsContent value="markdown" className="mt-0 h-full">
            <MonacoMarkdownEditor />
          </TabsContent>
          <TabsContent value="javascript" className="mt-0 h-full">
            <MonacoEditorJS />
          </TabsContent>
          <TabsContent value="camera" className="mt-0 h-full">
            <CameraControls cameraSnapshot={cameraSnapshot as CameraSnapshot | null} />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
