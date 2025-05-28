"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  CurrentMvsDataAtom,
  ScenesAtom,
  ActiveSceneIdAtom,
  getActiveScene,
  executeCode,
} from "../appstate";
import { molstarParams } from "./config/MolStar-config";

// Type definitions for MolStar viewer (not declared in existing types)
interface MolstarViewer {
  dispose: () => void;
  loadMvsData: (data: unknown, format: string, options: { replaceExisting: boolean }) => Promise<void>;
  plugin: {
    canvas3d?: {
      didDraw: {
        subscribe: (callback: () => void) => { unsubscribe: () => void };
      };
      camera: {
        getSnapshot: () => CameraSnapshot;
      };
    };
  };
}

interface CameraSnapshot {
  position: number[];
  target: number[];
  up: number[];
  radius?: number;
}

// Helper function
const checkMolstarReady = (): Promise<boolean> => {
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
const useMolstarViewer = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [viewer, setViewer] = useState<MolstarViewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraSnapshot, setCameraSnapshot] = useState<CameraSnapshot | null>(null);
  const [cameraTrackingEnabled, setCameraTrackingEnabled] = useState(false);

  const cameraSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initViewer = async () => {
      try {
        console.log("Initializing Molstar...");

        // Wait for Molstar to be ready
        await checkMolstarReady();

        console.log("Creating Molstar viewer...");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newViewer = await (window as any).molstar.Viewer.create(
          containerRef.current!,
          molstarParams,
        ) as MolstarViewer;

        setViewer(newViewer);
        setIsReady(true);
        console.log("Molstar viewer ready!");
      } catch (error) {
        console.error("Error creating Molstar viewer:", error);
      }
    };

    initViewer();

    return () => {
      if (viewer) {
        viewer.dispose();
      }
      if (cameraSubscriptionRef.current) {
        cameraSubscriptionRef.current.unsubscribe();
      }
      setViewer(null);
      setIsReady(false);
      setCameraSnapshot(null);
      setCameraTrackingEnabled(false);
    };
  }, [containerRef]);

  // Camera subscription effect
  useEffect(() => {
    if (viewer && isReady && cameraTrackingEnabled) {
      console.log("Setting up camera tracking...");

      // Subscribe to camera changes
      const subscription = viewer.plugin.canvas3d?.didDraw.subscribe(
        () => {
          const snapshot = viewer.plugin.canvas3d?.camera.getSnapshot();
          if (snapshot) {
            setCameraSnapshot(snapshot);
          }
        },
      );
      cameraSubscriptionRef.current = subscription || null;

      return () => {
        if (cameraSubscriptionRef.current) {
          cameraSubscriptionRef.current.unsubscribe();
          cameraSubscriptionRef.current = null;
        }
      };
    }
  }, [viewer, isReady, cameraTrackingEnabled]);

  return {
    viewer,
    isReady,
    cameraSnapshot,
    cameraTrackingEnabled,
    setCameraTrackingEnabled,
  };
};

export function MolStar() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mvsData] = useAtom(CurrentMvsDataAtom);
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [, setCurrentMvsData] = useAtom(CurrentMvsDataAtom);

  const {
    viewer,
    isReady,
    cameraSnapshot,
    cameraTrackingEnabled,
    setCameraTrackingEnabled,
  } = useMolstarViewer(containerRef);

  const activeScene = getActiveScene(scenes, activeSceneId);

  // Load initial data when viewer is ready
  useEffect(() => {
    if (viewer && isReady && activeScene) {
      executeCode(activeScene.javascript, setCurrentMvsData);
    }
  }, [viewer, isReady, activeScene, setCurrentMvsData]);

  // Load data when mvsData changes and viewer is ready
  useEffect(() => {
    if (viewer && mvsData && isReady) {
      console.log("Loading MVS data into viewer...", mvsData);
      viewer
        .loadMvsData(mvsData, "mvsj", { replaceExisting: true })
        .then(() => {
          console.log("MVS data loaded successfully");
        })
        .catch((error: unknown) => {
          console.error("Error loading MVS data:", error);
        });
    }
  }, [viewer, mvsData, isReady]);

  return (
    <div className="molstar-container">
      <div className="molstar" ref={containerRef}></div>

      {/* Camera Info Panel */}
      <div className="camera-info-panel">
        <div className="camera-controls">
          <button
            onClick={() => setCameraTrackingEnabled(!cameraTrackingEnabled)}
            className={`camera-toggle-btn ${cameraTrackingEnabled ? "active" : ""}`}
          >
            {cameraTrackingEnabled ? "Disable" : "Enable"} Camera Tracking
          </button>
        </div>

        {cameraTrackingEnabled && (
          <div className="camera-info">
            <h4>Camera Information</h4>
            {cameraSnapshot ? (
              <div className="camera-data">
                <div className="camera-field">
                  <strong>Position:</strong>
                  <pre>{JSON.stringify(cameraSnapshot.position, null, 2)}</pre>
                </div>
                <div className="camera-field">
                  <strong>Target:</strong>
                  <pre>{JSON.stringify(cameraSnapshot.target, null, 2)}</pre>
                </div>
                <div className="camera-field">
                  <strong>Up Vector:</strong>
                  <pre>{JSON.stringify(cameraSnapshot.up, null, 2)}</pre>
                </div>
                {cameraSnapshot.radius && (
                  <div className="camera-field">
                    <strong>Radius:</strong>
                    <span>{cameraSnapshot.radius.toFixed(3)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-camera-data">
                Move the camera to see position data
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}