"use client";

import React from "react";
import { MolStar } from "./components/MolStar";
import { SceneEditors } from "./components/SceneEditors";
import { ExportButton } from "./components/ExportButton";
import { SceneList } from "./components/SceneList";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 md:px-8 md:py-4 bg-background border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">StoriesCreator</h1>
        <ExportButton />
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <SceneList />
          <SceneEditors />
        </div>

        {/* Right Column */}
        <div className="flex flex-col h-full min-h-[500px] lg:min-h-[600px]">
          <MolStar />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border px-4 py-3 md:px-8 md:py-4 text-center">
        <div className="text-muted-foreground text-sm">
          <p>Links and resources will be added here</p>
        </div>
      </footer>
    </div>
  );
}
