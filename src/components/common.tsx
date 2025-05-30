import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';
import { MenuIcon } from 'lucide-react';

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

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className='bg-background border-b border-border'>
      <div className='flex justify-between items-center px-4 py-2 md:px-6'>
        <div className='flex items-center gap-6'>
          <HeaderLogo />
          <Separator orientation='vertical' className='h-6' />
          <div className='hidden lg:flex items-center'>{children}</div>
        </div>

        <div className='flex items-center gap-4'>
          <MobileMenuButton />
        </div>
      </div>
    </header>
  );
}
