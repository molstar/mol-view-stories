"use client";

import React from "react";
import { useAtom } from "jotai";
import { ScenesAtom, ActiveSceneIdAtom, SetActiveSceneAtom } from "@/app/appstate";
import { ExportButton } from "@/components/story-builder/ExportButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Controls() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);

  const activeScene = scenes.find(scene => scene.id === activeSceneId);

  const handleSceneChange = (value: string) => {
    const sceneId = parseInt(value, 10);
    setActiveScene(sceneId);
  };

  return (
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
  );
}