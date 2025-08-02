import { X } from 'lucide-react';
import Image from 'next/image';
import React, { ReactNode, useState } from 'react';
import { LoginButton } from './login';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useRouter, usePathname } from 'next/navigation';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ConfirmDialog } from './ui/confirm-dialog';
import Link from 'next/link';

function HeaderLogo() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasUnsavedChanges, disableUnsavedChanges } = useUnsavedChanges({ enableBeforeUnload: false });
  const [showDialog, setShowDialog] = React.useState(false);
  const handleClick = (e: React.MouseEvent) => {
    // Only intercept if on /builder
    if (pathname.includes('/builder') && hasUnsavedChanges) {
      e.preventDefault();
      disableUnsavedChanges(); // Disable browser alerts
      setShowDialog(true);
    }
  };
  const handleConfirm = () => {
    setShowDialog(false);
    router.push('/');
  };
  return (
    <>
      <Link
        href='/'
        onClick={handleClick}
        className='flex items-center gap-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors bg-transparent border-none p-0 cursor-pointer'
        style={{ background: 'none', border: 'none' }}
      >
        <Image src='/favicon.ico' alt='MolViewStories' width={24} height={24} className='w-6 h-6' />
        MolViewStories
      </Link>
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title='Unsaved Changes'
        description='You have unsaved changes. Are you sure you want to leave this page? Unsaved changes will be lost.'
        confirmText='Leave Page'
        cancelText='Stay'
        onConfirm={handleConfirm}
        isDestructive
      />
    </>
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

export function Header({
  children,
  actions,
  hideAutoLogin = false,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  hideAutoLogin?: boolean;
}) {
  return (
    <header className='bg-gray-50 border-b border-border sticky top-0'>
      <PreviewBanner />
      <div className='flex justify-between items-center px-4 py-2'>
        <div className='flex items-center gap-4'>
          <HeaderLogo />
          <div className='flex items-center'>{children}</div>
        </div>

        <div className='flex items-center gap-2'>
          {!hideAutoLogin && <LoginButton />}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function Main({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn('flex-1 flex flex-col gap-4 px-4 py-6 mx-auto w-full h-full', className)}>{children}</main>
  );
}

export function PressToSave() {
  return (
    <div className='text-xs text-muted-foreground mb-2'>
      <span className='bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none'>
        <span>Ctrl/⌘/Alt + S/Enter</span>
      </span>{' '}
      to save
    </div>
  );
}

export function PressToCodeComplete() {
  return (
    <div className='text-xs text-muted-foreground mb-2'>
      <span className='bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none'>
        <span>Ctrl + Space</span>
      </span>{' '}
      for code completion
    </div>
  );
}

export function TooltipWrapper({
  children,
  tooltip,
  side,
}: {
  children: ReactNode;
  tooltip: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
