'use client';

import { exportState, StoryAtom } from '@/app/appstate';
import { MenubarItem } from '@/components/ui/menubar';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

export function ExportSessionButton() {
  const story = useAtomValue(StoryAtom);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportState(story);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MenubarItem onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export Session'}
    </MenubarItem>
  );
}
