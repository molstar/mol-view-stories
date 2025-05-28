"use client";

import React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Create Interactive
          <span className="text-primary"> Molecular Stories</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Build engaging, interactive molecular visualizations with code. 
          Combine MolStar&apos;s powerful 3D rendering with custom scripts to tell your scientific story.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/story-builder"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Building
          </Link>
          
          <Link 
            href="/story-view"
            className="border border-border px-8 py-3 rounded-lg font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            View Examples
          </Link>
        </div>
      </div>
    </section>
  );
}