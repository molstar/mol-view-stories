"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MolStar } from "@/components/story-builder/MolStar";
import { SceneEditors } from "@/components/story-builder/SceneEditors";
import { ExportButton } from "@/components/story-builder/ExportButton";

import { ScenesAtom, ActiveSceneIdAtom, SetActiveSceneAtom } from "@/app/appstate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";

export default function StoryBuilder() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);
  const [activeTab, setActiveTab] = useState("molstar");

  const activeScene = scenes.find(scene => scene.id === activeSceneId);

  const handleSceneChange = (value: string) => {
    const sceneId = parseInt(value, 10);
    setActiveScene(sceneId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Story Builder</h1>
          <div className="flex items-center gap-4">
            <Select value={activeSceneId.toString()} onValueChange={handleSceneChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a scene">
                  {activeScene?.header || "Select a scene"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {scenes.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id.toString()}>
                    {scene.header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton />
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8 flex-1">
          <div className="flex-1 flex flex-col h-full">
            <SceneEditors />
          </div>

          <div className="flex-1 flex flex-col h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <CardTitle className="text-sm text-muted-foreground">Visualization</CardTitle>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="molstar">MolStar</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsContent value="molstar" className="h-full">
                    <div className="w-full" style={{ aspectRatio: '1.3/1' }}>
                      <MolStar />
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown" className="h-full">
                    <div className="h-full min-h-[500px] bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-500 italic">
                        Markdown renderer component (TBD)
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
