import { useAuth } from '@/app/providers';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { LogOutIcon, LogInIcon, ChevronDownIcon, Library } from 'lucide-react';
import { toast } from 'sonner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { cn } from '@/lib/utils';
import { PopupBlockedDialog } from './popup-blocked-dialog';
import { exportState } from '@/app/state/actions';
import { useAtomValue } from 'jotai';
import { StoryAtom } from '@/app/state/atoms';
import { useRouter, usePathname } from 'next/navigation';
import { ConfirmDialog } from './ui/confirm-dialog';

export function LoginButton() {
  const auth = useAuth();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPopupBlockedDialog, setShowPopupBlockedDialog] = useState(false);
  const story = useAtomValue(StoryAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);

  if (auth.isAuthenticated) {
    const username = auth.user?.profile.preferred_username ?? auth.user?.profile.name ?? 'User';
    const handleMyStoriesClick = (e: React.MouseEvent) => {
      if (pathname.startsWith('/builder') && hasUnsavedChanges) {
        e.preventDefault();
        setShowDialog(true);
      } else {
        router.push('/my-stories');
      }
    };
    const handleConfirm = () => {
      setShowDialog(false);
      router.push('/my-stories');
    };
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='sm' className='gap-1.5 text-sm font-medium'>
              <div className='flex gap-2 items-center'>
                <div className='rounded-full bg-gray-200 text-gray-800 w-6 h-6 flex items-center justify-center'>
                  {username[0]?.toUpperCase() ?? 'U'}
                </div>
                {username}
              </div>
              <ChevronDownIcon className='size-3.5 opacity-60' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-[160px]'>
            <DropdownMenuItem asChild={false}>
              <button
                type='button'
                onClick={handleMyStoriesClick}
                className='flex items-center gap-2 w-full text-left bg-transparent border-none p-0 cursor-pointer'
                style={{ background: 'none', border: 'none' }}
              >
                <Library /> My Stories
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* using removeUser instead of signoutRedirect to avoid redirecting to the login page */}
            <DropdownMenuItem
              onClick={() => {
                auth.removeUser(); // This now handles all token clearing
              }}
              className='gap-2'
            >
              <LogOutIcon /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  const login = async () => {
    setIsRedirecting(true);

    try {
      // Use popup-based login to preserve unsaved changes
      const result = await auth.signinPopup();

      if (result.success) {
        toast.success('Login successful!', {
          position: 'top-center',
          duration: 3000,
        });
      } else if (result.error === 'POPUP_BLOCKED') {
        setShowPopupBlockedDialog(true);
      } else {
        // Don't show error for user cancellation
        if (result.error && !result.error.includes('cancelled')) {
          toast.error(result.error, {
            position: 'top-center',
            closeButton: true,
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.', {
        position: 'top-center',
        closeButton: true,
        duration: 4000,
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleExportFirst = async () => {
    try {
      await exportState(story);
      toast.success('Work exported successfully!', {
        position: 'top-center',
        duration: 2000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export work', {
        position: 'top-center',
        duration: 3000,
      });
    }
  };

  return (
    <>
      <Button variant={'default'} onClick={login} disabled={isRedirecting} className={cn('cursor-pointer')}>
        <LogInIcon />
        {isRedirecting && 'Authenticating...'}
        {!isRedirecting && 'Log in'}
      </Button>

      <PopupBlockedDialog
        isOpen={showPopupBlockedDialog}
        onClose={() => setShowPopupBlockedDialog(false)}
        hasUnsavedChanges={hasUnsavedChanges}
        onExportFirst={handleExportFirst}
      />
    </>
  );
}
