"use client";

import React from "react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  CurrentMvsDataAtom,
  CameraPositionAtom,
  getActiveScene,
  executeCode,
} from "../../app/appstate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Camera Position Component
const CameraPositionDisplay = ({ cameraSnapshot }) => {
  if (!cameraSnapshot) return null;

  return (
    <div className="bg-background border border-border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-2 text-foreground">
        Camera Position
      </h3>
      <div className="text-xs font-mono text-muted-foreground space-y-1">
        <div>
          <span className="font-medium">Position:</span>
          {cameraSnapshot.position
            ? ` [${cameraSnapshot.position[0]?.toFixed(2)}, ${cameraSnapshot.position[1]?.toFixed(2)}, ${cameraSnapshot.position[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        <div>
          <span className="font-medium">Target:</span>
          {cameraSnapshot.target
            ? ` [${cameraSnapshot.target[0]?.toFixed(2)}, ${cameraSnapshot.target[1]?.toFixed(2)}, ${cameraSnapshot.target[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        <div>
          <span className="font-medium">Up:</span>
          {cameraSnapshot.up
            ? ` [${cameraSnapshot.up[0]?.toFixed(2)}, ${cameraSnapshot.up[1]?.toFixed(2)}, ${cameraSnapshot.up[2]?.toFixed(2)}]`
            : " N/A"}
        </div>
        {cameraSnapshot.radius && (
          <div>
            <span className="font-medium">Radius:</span>{" "}
            {cameraSnapshot.radius.toFixed(2)}
          </div>
        )}
        {cameraSnapshot.fov && (
          <div>
            <span className="font-medium">FOV:</span>{" "}
            {cameraSnapshot.fov.toFixed(2)}°
          </div>
        )}
      </div>
    </div>
  );
};

export function SceneList() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId, setActiveSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setCurrentMvsData] = useAtom(CurrentMvsDataAtom);
  const [cameraSnapshot] = useAtom(CameraPositionAtom);

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
      {/* Camera Position Display */}
      <CameraPositionDisplay cameraSnapshot={cameraSnapshot} />
      
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