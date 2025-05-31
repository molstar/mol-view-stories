'use client';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { downloadStory, StoryAtom } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { DownloadIcon, ChevronDownIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function HeaderExportDropdown() {
  const story = useAtomValue(StoryAtom);
  const pathname = usePathname();
  
  // Only show export dropdown on story builder pages
  if (!pathname.includes('/builder')) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-sm font-medium">
          <DownloadIcon className="size-4" />
          Export
          <ChevronDownIcon className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem 
          onClick={() => downloadStory(story, 'state')}
          className="gap-2"
        >
          <DownloadIcon className="size-4" />
          Download Story
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => downloadStory(story, 'html')}
          className="gap-2"
        >
          <DownloadIcon className="size-4" />
          Download HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}