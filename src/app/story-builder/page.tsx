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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Story Builder</h1>
            <ExportButton />
          </div>
          <SceneList />
          <SceneEditors />
        </div>

        {/* Right Column */}
        <div className="flex flex-col h-full min-h-[500px] lg:min-h-[600px]">
          <MolStar />
        </div>
      </main>

      <Footer />
    </div>
  );
}