"use client";

import React, { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { initializeMolstarAtom } from "../appstate.ts";
// import { Viewer } from "molstar/build/viewer/molstar.js";

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

const createViewer = async (container, data) => {
  const viewer = await molstar.Viewer.create(container, molstarParams);
  if (data) await viewer.loadMvsData(data, "mvsj", { replaceExisting: true });
  return viewer;
};

const loadData = (viewer, data) =>
  viewer?.loadMvsData(data, "mvsj", { replaceExisting: true });

export function MolStar() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [molViewSpecJson, setMolViewSpecJson] = useAtom(initializeMolstarAtom);

  useEffect(() => {
    if (!containerRef.current) return;

    createViewer(containerRef.current, molViewSpecJson)
      .then((viewer) => (viewerRef.current = viewer))
      .catch(console.error);

    return () => viewerRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (viewerRef.current && molViewSpecJson) {
      loadData(viewerRef.current, molViewSpecJson).catch(console.error);
    }
  }, [molViewSpecJson]);

  return (
    <div className="molstar-container">
      <div className="molstar" ref={containerRef}></div>
    </div>
  );
}
