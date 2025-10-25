'use client';

import { MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { StoryAssetsAtom } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { CopyIcon, FolderIcon } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

export function AssetsMenu() {
  const storyAssets = useAtomValue(StoryAssetsAtom);

  return (
    <MenubarMenu>
      <MenubarTrigger className='text-sm flex items-center gap-1'>
        <FolderIcon className='size-4' />
        Assets
      </MenubarTrigger>
      <MenubarContent>
        {storyAssets.length === 0 ? (
          <MenubarItem disabled>No assets uploaded</MenubarItem>
        ) : (
          storyAssets.map((asset, index) => (
            <MenubarItem
              key={`${asset.name}-${index}`}
              onClick={() => {
                copyToClipboard(asset.name, 'Asset name');
              }}
              title='Click to copy asset name'
            >
              <CopyIcon className='size-4' /> {asset.name} ({Math.round(asset.content.length / 1024)}KB)
            </MenubarItem>
          ))
        )}
      </MenubarContent>
    </MenubarMenu>
  );
}

