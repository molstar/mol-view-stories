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
  const [cameraSnapshot, setCameraSnapshot] = useState(null);
  const [cameraTrackingEnabled, setCameraTrackingEnabled] = useState(false);
  const [, setActiveScene] = useAtom(SetActiveSceneAtom);
  const [activeScene] = useAtom(ActiveSceneAtom);
  
  const cameraSubscriptionRef = useRef(null);

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
      if (cameraSubscriptionRef.current) {
        cameraSubscriptionRef.current.unsubscribe();
      }
      setViewer(null);
      setIsReady(false);
      setCameraSnapshot(null);
      setCameraTrackingEnabled(false);
    };
  }, [setActiveScene, activeScene]);

  // Camera subscription effect
  useEffect(() => {
    if (viewer && isReady && cameraTrackingEnabled) {
      console.log("Setting up camera tracking...");
      
      // Subscribe to camera changes
      cameraSubscriptionRef.current = viewer.plugin.canvas3d?.didDraw.subscribe(() => {
        const snapshot = viewer.plugin.canvas3d?.camera.getSnapshot();
        if (snapshot) {
          setCameraSnapshot(snapshot);
        }
      });

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
    setCameraTrackingEnabled 
  };
};

export function MolStar() {
  const containerRef = useRef(null);
  const [mvsData] = useAtom(CurrentMvsDataAtom);
  const { 
    viewer, 
    isReady, 
    cameraSnapshot, 
    cameraTrackingEnabled, 
    setCameraTrackingEnabled 
  } = useMolstarViewer(containerRef);

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
      
      {/* Camera Info Panel */}
      <div className="camera-info-panel">
        <div className="camera-controls">
          <button 
            onClick={() => setCameraTrackingEnabled(!cameraTrackingEnabled)}
            className={`camera-toggle-btn ${cameraTrackingEnabled ? 'active' : ''}`}
          >
            {cameraTrackingEnabled ? 'Disable' : 'Enable'} Camera Tracking
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
              <div className="no-camera-data">Move the camera to see position data</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
