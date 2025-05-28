"use client";

import React from "react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  CurrentMvsDataAtom,
  getActiveScene,
  executeCode,
} from "./appstate";
import { MolStar } from "./components/MolStar";
import { MonacoEditorJS } from "./components/MonacoEditor";
import { MonacoMarkdownEditor } from "./components/MonacoMarkdownEditor";
import { ExportButton } from "./components/ExportButton";

function SceneList() {
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

function DescriptionBox() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  
  const activeScene = getActiveScene(scenes, activeSceneId);

  return (
    <div className="description-box">
      <h3 className="description-title">Scene Description</h3>
      {activeScene ? (
        <div>
          <h4 className="description-scene-title">{activeScene.header}</h4>
          <p className="description-scene-text">{activeScene.description}</p>
        </div>
      ) : (
        <p className="description-placeholder">Select a scene to view its description</p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">StoriesCreator</h1>
        <ExportButton />
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Column */}
        <div className="left-column">
          <DescriptionBox />
          <div className="editors-container">
            <div className="editor-section">
              <MonacoMarkdownEditor />
            </div>
            <div className="editor-section">
              <MonacoEditorJS />
            </div>
          </div>
          <SceneList />
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="viewer-container">
            <MolStar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>Links and resources will be added here</p>
        </div>
      </footer>
    </div>
  );
}