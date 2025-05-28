"use client";

import React from "react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  CurrentMvsDataAtom,
  getActiveScene,
  executeCode,
} from "../../app/appstate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SceneControls() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId, setActiveSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setCurrentMvsData] = useAtom(CurrentMvsDataAtom);

  const activeScene = getActiveScene(scenes, activeSceneId);

  const handleSceneSelect = async (sceneId: number) => {
    setActiveSceneId(sceneId);
    const selectedScene = getActiveScene(scenes, sceneId);
    if (selectedScene) {
      await executeCode(selectedScene.javascript, setCurrentMvsData);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Scenes List */}
      <Card>
        <CardHeader>
          <CardTitle>Scenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className={`p-4 border rounded-md cursor-pointer transition-all ${
                  activeScene?.id === scene.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:bg-accent hover:border-accent-foreground/20"
                }`}
                onClick={() => handleSceneSelect(scene.id)}
              >
                <h4 className="text-lg font-semibold mb-2 text-foreground">{scene.header}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{scene.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}