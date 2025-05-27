"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  CurrentMvsDataAtom,
  InitializeMolstarAtom,
  UpdateMvsDataAtom,
} from "../appstate";
import { molstarParams } from "./MolStar-config";

export function MolStar() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [mvsData] = useAtom(CurrentMvsDataAtom);
  const [, initializeMolstar] = useAtom(InitializeMolstarAtom);
  const [, updateMvsData] = useAtom(UpdateMvsDataAtom);

  // Initialize viewer on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const initViewer = async () => {
      try {
        console.log("Initializing Molstar...");
        await initializeMolstar();
        console.log("Creating Molstar viewer...");
        const viewer = await molstar.Viewer.create(
          containerRef.current,
          molstarParams,
        );
        viewerRef.current = viewer;
        setIsViewerReady(true);
        console.log("Molstar viewer ready!");

        // Trigger initial data load now that viewer is ready
        setTimeout(() => {
          updateMvsData();
        }, 100);
      } catch (error) {
        console.error("Error creating Molstar viewer:", error);
      }
    };

    initViewer();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      setIsViewerReady(false);
    };
  }, [initializeMolstar, updateMvsData]);

  // Load data when mvsData changes and viewer is ready
  useEffect(() => {
    if (viewerRef.current && mvsData && isViewerReady) {
      console.log("Loading MVS data into viewer...", mvsData);
      viewerRef.current
        .loadMvsData(mvsData, "mvsj", { replaceExisting: true })
        .then(() => {
          console.log("MVS data loaded successfully");
        })
        .catch((error) => {
          console.error("Error loading MVS data:", error);
        });
    }
  }, [mvsData, isViewerReady]);

  return (
    <div className="molstar-container">
      <div className="molstar" ref={containerRef}></div>
    </div>
  );
}
