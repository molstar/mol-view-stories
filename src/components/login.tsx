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
import {
  LogOutIcon,
  LogInIcon,
  ChevronDownIcon,
  GalleryHorizontalEnd,
  BarChart3,
  Database,
  Library,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { cn } from '@/lib/utils';
import { PopupBlockedDialog } from './popup-blocked-dialog';
import { exportState } from '@/app/state/actions';
import { useAtomValue } from 'jotai';
import { StoryAtom } from '@/app/state/atoms';
import { StorageDialog } from '@/app/my-stories/components';
import { useMyStoriesData } from '@/app/my-stories/useMyStoriesData';

export function LoginButton() {
  const auth = useAuth();
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPopupBlockedDialog, setShowPopupBlockedDialog] = useState(false);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const story = useAtomValue(StoryAtom);
  const myStories = useMyStoriesData(auth.isAuthenticated);

  if (auth.isAuthenticated) {
    const username = auth.user?.profile.preferred_username ?? auth.user?.profile.name ?? 'User';
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
            <DropdownMenuItem asChild>
              <Link href='/my-stories'>
                <Library /> My Stories
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowStorageDialog(true)}>
              <BarChart3 /> Storage
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

        <StorageDialog
          open={showStorageDialog}
          onOpenChange={setShowStorageDialog}
          quota={myStories.quota}
          quotaLoading={myStories.quotaLoading}
          quotaError={myStories.quotaError}
          onRefreshQuota={myStories.loadQuota}
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
        {isRedirecting && 'Opening login...'}
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
