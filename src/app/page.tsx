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