"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  CurrentMvsDataAtom,
  SetActiveSceneAtom,
  ActiveSceneAtom,
  CameraPositionAtom,
} from "../../app/appstate";
import { molstarParams } from "./config/MolStar-config";

// Declare molstar global type
declare global {
  interface Window {
    molstar: {
      Viewer: {
        create: (container: HTMLElement, params: unknown) => Promise<MolstarViewer>;
      };
      PluginExtensions: {
        mvs: unknown;
      };
    };
  }
}

interface MolstarViewer {
  dispose: () => void;
  loadMvsData: (data: unknown, format: string, options: { replaceExisting: boolean }) => Promise<void>;
  plugin: {
    canvas3d?: {
      didDraw: {
        subscribe: (callback: () => void) => void;
      };
      camera: {
        getSnapshot: () => unknown;
      };
    };
  };
}

// Helper function
const checkMolstarReady = () => {
  return new Promise((resolve) => {
    if (window.molstar?.PluginExtensions?.mvs) {
      resolve(true);
      return;
    }
    let attempts = 0;
    const maxAttempts = 100;

    const checkInterval = setInterval(() => {
      attempts++;
      if (window.molstar?.PluginExtensions?.mvs) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error("Timed out waiting for Molstar MVS extension");
        resolve(false);
      }
    }, 100);
  });
};

// Custom hook for Molstar initialization
const useMolstarViewer = (containerRef) => {
  const [viewer, setViewer] = useState<MolstarViewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [, setCameraPosition] = useAtom(CameraPositionAtom);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);
  const [activeScene] = useAtom(ActiveSceneAtom);

  useEffect(() => {
    if (!containerRef.current) return;

    const initViewer = async () => {
      try {
        console.log("Initializing Molstar...");

        // Wait for Molstar to be ready
        await checkMolstarReady();

        console.log("Creating Molstar viewer...");
        const newViewer = await window.molstar.Viewer.create(
          containerRef.current,
          molstarParams,
        );

        setViewer(newViewer);
        setIsReady(true);
        console.log("Molstar viewer ready!");

        // Set up camera tracking
        if (newViewer.plugin.canvas3d?.didDraw) {
          newViewer.plugin.canvas3d.didDraw.subscribe(() => {
            const snapshot = newViewer.plugin.canvas3d?.camera.getSnapshot();
            if (snapshot) {
              setCameraPosition(snapshot);
              console.log("Camera snapshot:", snapshot);
            }
          });
        }

        // Trigger initial data load for active scene
        setTimeout(() => {
          if (activeScene) {
            setActiveScene(activeScene.id);
          }
        }, 100);
      } catch (error) {
        console.error("Error creating Molstar viewer:", error);
      }
    };

    initViewer();

    return () => {
      if (viewer) {
        viewer.dispose();
      }
      setViewer(null);
      setIsReady(false);
      setCameraPosition(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveScene, activeScene]);

  return { viewer, isReady };
};

export function MolStar() {
  const containerRef = useRef(null);
  const [mvsData] = useAtom(CurrentMvsDataAtom);
  const { viewer, isReady } = useMolstarViewer(containerRef);

  // Load data when mvsData changes and viewer is ready
  useEffect(() => {
    if (viewer && mvsData && isReady) {
      console.log("Loading MVS data into viewer...", mvsData);
      viewer
        .loadMvsData(mvsData, "mvsj", { replaceExisting: true })
        .then(() => {
          console.log("MVS data loaded successfully");
        })
        .catch((error) => {
          console.error("Error loading MVS data:", error);
        });
    }
  }, [mvsData, isReady, viewer]);

  return (
    <div className="rounded overflow-hidden w-full h-full border border-border bg-background relative">
      {/* MolStar Viewer */}
      <div className="w-full h-full relative" ref={containerRef}></div>
    </div>
  );
}
