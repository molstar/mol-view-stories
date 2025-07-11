import { useAuth } from '@/app/providers';
import { useAtomValue } from 'jotai';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { LogOutIcon, LogInIcon, ChevronDownIcon, GalleryHorizontalEnd } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { StoryAtom, CurrentViewAtom } from '@/app/state/atoms';
import { startLogin } from '@/lib/auth-utils';

export function LoginButton() {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);
  const currentView = useAtomValue(CurrentViewAtom);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (auth.isAuthenticated) {
    const username = auth.user?.profile.preferred_username ?? auth.user?.profile.name ?? 'User';
    return (
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
              <GalleryHorizontalEnd /> My Stories
            </Link>
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
    );
  }

  const login = async () => {
    setIsRedirecting(true);
    try {
      // Use PKCE login flow that preserves state
      await startLogin(story, currentView);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.', {
        position: 'top-center',
        closeButton: true,
        duration: 4000,
      });
      setIsRedirecting(false);
    }
  };

  return (
    <Button variant='outline' onClick={login} disabled={isRedirecting} className='cursor-pointer'>
      <LogInIcon />
      {isRedirecting && 'Redirecting...'}
      {!isRedirecting && 'Login with Life Science AAI'}
    </Button>
  );
}
