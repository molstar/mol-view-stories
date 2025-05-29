"use client";

import { ActiveSceneAtom } from "@/app/appstate";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtomValue } from "jotai";
import { Edit } from "lucide-react";
import dynamic from "next/dynamic";
import Markdown from "react-markdown";
import { Label } from "../ui/label";
import { CameraControls } from "./CameraControls";
import { MonacoEditorJS } from "./editors/MonacoCodeEditor";
import { MonacoMarkdownEditor } from "./editors/MonacoMarkdownEditor";
import { OptionsEditor } from "./editors/Options";

// Don't want Mol* to be rendered on the server side
const CurrentSceneView = dynamic(() => import("./CurrentSceneView"), { ssr: false });

export function SceneEditors() {
  return (
    <Tabs defaultValue="scene" className="w-full h-full">
      <Card className="w-full h-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <CardTitle className="text-sm text-muted-foreground">Scene Editor</CardTitle>
            </div>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="scene">3D View</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>
          </div>

        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <TabsContent value="description" className="mt-0 h-full">
            <div className="space-y-4">
              <OptionsEditor />
              <Label>Markdown Description</Label>
              <div className="flex gap-6">
                <div className="flex-1">
                  <MonacoMarkdownEditor />
                </div>
                <div className="flex-1">
                  <MarkdownRenderer />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="scene" className="mt-0 h-full">
            <div className="flex gap-6">
              <div className="space-y-4 flex-1">
                <CameraControls />
                <MonacoEditorJS />
              </div>
              <div className="flex-1">
                <div className="w-full" style={{ aspectRatio: "1.3/1" }}>
                  <CurrentSceneView />
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function MarkdownRenderer() {
  const scene = useAtomValue(ActiveSceneAtom);
  return <div className="h-full min-h-[500px] max-h-[500px] bg-gray-50 rounded-lg p-4 overflow-y-auto">
    <div className="prose">
      <Markdown skipHtml>{scene?.description || ''}</Markdown>
    </div>
  </div>;
}
