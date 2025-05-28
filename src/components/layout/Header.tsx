"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="flex justify-between items-center px-4 py-3 md:px-8 md:py-4 bg-background border-b border-border">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-3xl font-bold text-foreground hover:text-foreground/80 transition-colors">
          StoriesCreator
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors ${
              isActive("/") 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </Link>
          <Link 
            href="/story-builder" 
            className={`text-sm font-medium transition-colors ${
              isActive("/story-builder") 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Story Builder
          </Link>
          <Link 
            href="/story-view" 
            className={`text-sm font-medium transition-colors ${
              isActive("/story-view") 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            View Stories
          </Link>
        </nav>
      </div>

      {/* Mobile menu button - you can expand this later */}
      <div className="md:hidden">
        <button className="text-foreground">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}