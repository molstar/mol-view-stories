"use client";

import React from "react";
import { useAtom } from "jotai";
import {
  ScenesAtom,
  ActiveSceneIdAtom,
  getActiveScene,
} from "./appstate";
import { MolStar } from "./components/MolStar";
import { MonacoEditorJS } from "./components/MonacoEditor";
import { MonacoMarkdownEditor } from "./components/MonacoMarkdownEditor";
import { ExportButton } from "./components/ExportButton";
import { SceneList } from "./components/SceneList";



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
          <SceneList />
          <DescriptionBox />
          <div className="editors-container">
            <div className="editor-section">
              <MonacoMarkdownEditor />
            </div>
            <div className="editor-section">
              <MonacoEditorJS />
            </div>
          </div>
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