"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SceneEditors } from "@/components/story-builder/SceneEditors";
import { Controls } from "@/components/story-builder/Controls";
import { VisualizationPanel } from "@/components/story-builder/VisualizationPanel";

export default function StoryBuilder() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col gap-6 lg:gap-8 px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full h-full">
        <Controls />
        <div className="flex gap-6 lg:gap-8 flex-1 h-full min-h-0">
          <div className="flex-1 flex flex-col h-full min-h-0">
            <SceneEditors />
          </div>
          <div className="flex-1 flex flex-col h-full min-h-0">
            <VisualizationPanel />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
