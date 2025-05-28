"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { ScenesAtom, ActiveSceneIdAtom, CurrentMvsDataAtom, exportState } from "../appstate";

export function ExportButton() {
  const [scenes] = useAtom(ScenesAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [currentMvsData] = useAtom(CurrentMvsDataAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(scenes, activeSceneId, currentMvsData);
      console.log("Export completed successfully");
    } catch (error) {
      console.error("Error during export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
        isExporting 
          ? "bg-gray-400 text-white cursor-not-allowed" 
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isExporting ? "Exporting..." : "Export JSON"}
    </button>
  );
}