'use client';

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { StoryAtom, ActiveSceneIdAtom, exportState, downloadStory } from '../../app/appstate';
import { Button } from '@/components/ui/button';

export function ExportButton() {
  const story = useAtomValue(StoryAtom);
  const activeSceneId = useAtomValue(ActiveSceneIdAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(story, activeSceneId, {});
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant='default'>
      {isExporting ? 'Exporting...' : 'Export JSON'}
    </Button>
  );
}

export function DownloadStoryButtons() {
  // TODO: loading state
  const story = useAtomValue(StoryAtom);

  return (
    <>
      <Button onClick={() => downloadStory(story, 'state')} variant='default'>
        Download Story
      </Button>
      <Button onClick={() => downloadStory(story, 'html')} variant='default'>
        Download HTML
      </Button>
    </>
  );
}
