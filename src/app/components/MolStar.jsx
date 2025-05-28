"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { CurrentMvsDataAtom, SetActiveSceneAtom, ActiveSceneAtom } from "../appstate";
import { molstarParams } from "./MolStar-config";

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
  const [viewer, setViewer] = useState(null);
  const [isReady, setIsReady] = useState(false);
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
        const newViewer = await molstar.Viewer.create(
          containerRef.current,
          molstarParams,
        );

        setViewer(newViewer);
        setIsReady(true);
        console.log("Molstar viewer ready!");

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
    };
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
    <div className="molstar-container">
      <div className="molstar" ref={containerRef}></div>
    </div>
  );
}
