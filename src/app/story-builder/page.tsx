"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MolStar } from "@/components/story-builder/MolStar";
import { SceneEditors } from "@/components/story-builder/SceneEditors";
import { ExportButton } from "@/components/story-builder/ExportButton";
import { SceneList } from "@/components/story-builder/SceneList";

export default function StoryBuilder() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Story Builder</h1>
          <ExportButton />
        </div>

        {/* Row 1: Scene Data (1/3) + Code Editors (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Col 1: Scene Data (1/3) */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <SceneList />
          </div>

          {/* Col 2-3: Code Editors (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
            <SceneEditors />
          </div>
        </div>

        {/* Row 2: Mol Viewer (2/3) + Markdown Renderer (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1">
          {/* Col 1-2: Mol Viewer (2/3) */}
          <div className="lg:col-span-2 flex flex-col h-full min-h-[500px] lg:min-h-[600px]">
            <MolStar />
          </div>

          {/* Col 3: Markdown Renderer (1/3) */}
          <div className="flex flex-col h-full min-h-[500px] lg:min-h-[600px] bg-gray-50 rounded-lg p-4">
            {/* TODO: Add Markdown Renderer Component */}
            <div className="text-gray-500 italic">Markdown renderer component (TBD)</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}