"use client";

import React, { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { JSAtomScopeContext } from "./atomScope";

const molstarParams = {
  allowMajorPerformanceCaveat: true,
  collapseLeftPanel: false,
  collapseRightPanel: false,
  customFormats: [],
  disableAntialiasing: false,
  disabledExtensions: [],
  emdbProvider: "rcsb",
  illumination: false,
  layoutIsExpanded: false,
  layoutShowControls: false,
  layoutShowLeftPanel: false,
  layoutShowLog: false,
  layoutShowRemoteState: false,
  layoutShowSequence: true,
  pdbProvider: "rcsb",
  pickScale: 1,
  pixelScale: 1,
  pluginStateServer: "",
  powerPreference: "default",
  preferWebgl1: false,
  rcsbAssemblySymmetryApplyColors: true,
  rcsbAssemblySymmetryDefaultServerType: "full",
  rcsbAssemblySymmetryDefaultServerUrl: "",
  resolutionMode: "auto",
  saccharideCompIdMapType: "default",
  transparency: true,
  viewportShowAnimation: false,
  viewportShowControls: true,
  viewportShowExpand: true,
  viewportShowSelectionMode: false,
  viewportShowSettings: true,
  viewportShowTrajectoryControls: false,
  volumeStreamingDisabled: false,
};

export function MolStar() {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const atomScope = useJSAtomScope();
  const [molViewSpecJson] = useAtom(atomScope.molViewSpecJsonAtom);

  // Initialize the component
  useEffect(() => {
    if (!containerRef.current) return;

    molstar.Viewer.create(containerRef.current, molstarParams)
      .then((viewer) => {
        instanceRef.current = viewer;
        if (molViewSpecJson) {
          viewer.loadMvsData(molViewSpecJson, "mvsj", {
            replaceExisting: true,
          });
        }
      })
      .catch((err) =>
        console.error(`Failed to initialize MolStar: ${err.message}`),
      );

    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, []);

  // Update when molViewSpecJson changes
  useEffect(() => {
    if (instanceRef.current && molViewSpecJson) {
      console.log(
        "MolStar: Loading new data",
        typeof molViewSpecJson,
        molViewSpecJson,
      );
      try {
        instanceRef.current.loadMvsData(molViewSpecJson, "mvsj", {
          replaceExisting: true,
        });
      } catch (error) {
        console.error("MolStar: Error loading data:", error);
      }
    }
  }, [molViewSpecJson]);

  return (
    <div className="molstar-container">
      <div className="molstar" ref={containerRef}></div>
    </div>
  );
}
