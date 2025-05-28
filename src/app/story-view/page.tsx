"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function StoryView() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Story Viewer
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            View and interact with completed molecular stories. This page will display 
            consolidated stories with playback controls and navigation.
          </p>
          <div className="bg-muted/20 border border-border rounded-lg p-8 max-w-md mx-auto">
            <p className="text-muted-foreground">
              Story viewer functionality coming soon...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}