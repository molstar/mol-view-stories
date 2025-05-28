"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { ScenesAtom, ActiveSceneIdAtom, CurrentMvsDataAtom, exportState } from "../../app/appstate";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="default"
    >
      {isExporting ? "Exporting..." : "Export JSON"}
    </Button>
  );
}