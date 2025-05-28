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
      <header className="flex justify-between items-center p-4 md:px-8 bg-gray-50 border-b border-gray-200 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">StoriesCreator</h1>
        <ExportButton />
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <SceneList />
          <div className="flex flex-col gap-6">
            <SceneEditors />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          <div className="h-full min-h-[600px]">
            <MolStar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 p-4 md:px-8 text-center">
        <div className="text-gray-500 text-sm">
          <p>Links and resources will be added here</p>
        </div>
      </footer>
    </div>
  );
}
