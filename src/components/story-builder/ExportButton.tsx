"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";
import { StoryAtom, ActiveSceneIdAtom, exportState, downloadStory } from "../../app/appstate";
import { Button } from "@/components/ui/button";

export function ExportButton() {
  const [story] = useAtom(StoryAtom);
  const [activeSceneId] = useAtom(ActiveSceneIdAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(story, activeSceneId, {});
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

export function DownloadStoryButton() {
  // TODO: loading state
  const [story] = useAtom(StoryAtom);

  return (
    <Button
      onClick={() => downloadStory(story)}
      variant="default"
    >
      Download Story
    </Button>
  );
}