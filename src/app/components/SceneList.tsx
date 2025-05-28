"use client";

import React from "react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  CurrentMvsDataAtom,
  getActiveScene,
  executeCode,
} from "../appstate";

export function SceneList() {
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
    <div className="scene-list">
      <h3 className="scene-list-title">Scenes</h3>
      <ul className="scene-list-items">
        {scenes.map((scene) => (
          <li
            key={scene.id}
            className={`scene-item ${
              activeScene?.id === scene.id ? "scene-item-active" : ""
            }`}
            onClick={() => handleSceneSelect(scene.id)}
          >
            <h4 className="scene-item-title">{scene.header}</h4>
            <p className="scene-item-description">{scene.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}