import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';
import { MenuIcon, X, DownloadIcon, ChevronDownIcon } from 'lucide-react';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { downloadStory, StoryAtom } from '@/app/appstate';
import { useAtomValue } from 'jotai';
import { usePathname } from 'next/navigation';

function HeaderLogo() {
  return (
    <Link
      href='/'
      className='flex items-center gap-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors'
    >
      <Image src='/favicon.ico' alt='MolViewStories' width={24} height={24} className='w-6 h-6' />
      MolViewStories
    </Link>
  );
}

function MobileMenuButton() {
  return (
    <div className='md:hidden'>
      <button className='text-foreground'>
        <MenuIcon className='w-5 h-5' />
      </button>
    </div>
  );
}

function PreviewBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className='bg-gradient-to-r from-orange-500 via-pink-500 to-orange-600 text-white relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse'></div>
      <div className='relative flex items-center justify-center px-4 py-2 text-sm font-medium'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>🚧</span>
          <span>PREVIEW VERSION - Features may change</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className='absolute right-4 p-1 hover:bg-white/20 rounded-full transition-colors'
          aria-label='Dismiss preview banner'
        >
          <X className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}

function HeaderExportDropdown() {
  const story = useAtomValue(StoryAtom);
  const pathname = usePathname();

  // Only show export dropdown on story builder pages
  if (!pathname.includes('/builder')) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='gap-1.5 text-sm font-medium'>
          <DownloadIcon className='size-4' />
          Export
          <ChevronDownIcon className='size-3.5 opacity-60' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[160px]'>
        <DropdownMenuItem onClick={() => downloadStory(story, 'state')} className='gap-2'>
          <DownloadIcon className='size-4' />
          Download Story
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadStory(story, 'html')} className='gap-2'>
          <DownloadIcon className='size-4' />
          Download HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className='bg-background border-b border-border'>
      <PreviewBanner />
      <div className='flex justify-between items-center px-4 py-2 md:px-6'>
        <div className='flex items-center gap-6'>
          <HeaderLogo />
          <Separator orientation='vertical' className='h-6' />
          <div className='hidden lg:flex items-center'>{children}</div>
        </div>

        <div className='flex items-center gap-4'>
          <HeaderExportDropdown />
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
