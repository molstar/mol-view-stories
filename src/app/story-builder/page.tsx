"use client";

import React from "react";
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

export default function StoryBuilder() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);

  const activeScene = scenes.find(scene => scene.id === activeSceneId);

  const handleSceneChange = (value: string) => {
    const sceneId = parseInt(value, 10);
    setActiveScene(sceneId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
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

        <div className="flex flex-col gap-4 lg:gap-6">
          <SceneEditors />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1">
          <div className="lg:col-span-2 flex flex-col h-full min-h-[500px] lg:min-h-[600px]">
            <MolStar />
          </div>

          <div className="flex flex-col h-full min-h-[500px] lg:min-h-[600px] bg-gray-50 rounded-lg p-4">
            <div className="text-gray-500 italic">
              Markdown renderer component (TBD)
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
