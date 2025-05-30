'use client';

import { OpenSessionAtom } from '@/app/appstate';
import { MenubarItem } from '@/components/ui/menubar';
import { useAtom } from 'jotai';

export function ImportSessionButton() {
  const [, setIsOpen] = useAtom(OpenSessionAtom);

  return <MenubarItem onClick={() => setIsOpen(true)}>Import Session</MenubarItem>;
}