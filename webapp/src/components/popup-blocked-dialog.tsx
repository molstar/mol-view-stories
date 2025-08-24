'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { startLogin } from '@/lib/auth-utils';

interface PopupBlockedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hasUnsavedChanges: boolean;
  onExportFirst?: () => void;
}

export function PopupBlockedDialog({ isOpen, onClose, hasUnsavedChanges, onExportFirst }: PopupBlockedDialogProps) {
  const handleRedirectLogin = async () => {
    onClose();
    await startLogin();
  };

  const handleExportAndLogin = async () => {
    if (onExportFirst) {
      onExportFirst();
    }
    // Give a moment for export to complete
    setTimeout(async () => {
      await handleRedirectLogin();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-500' />
            Popup Blocked
          </DialogTitle>
          <DialogDescription>Your browser blocked the login popup. Please choose how to proceed:</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 pt-4'>
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-md text-sm'>
            <div className='font-medium text-blue-800 mb-1'>How to enable popups (recommended):</div>
            <div className='text-blue-700 text-xs space-y-1'>
              <div>• Click the popup blocked icon in your address bar</div>
              <div>• Select &quot;Always allow popups from this site&quot;</div>
              <div>• Try logging in again</div>
            </div>
          </div>

          {hasUnsavedChanges ? (
            <div className='space-y-3'>
              <div className='p-3 bg-amber-50 border border-amber-200 rounded-md text-sm'>
                <div className='font-medium text-amber-800 mb-1'>⚠️ You have unsaved changes</div>
                <div className='text-amber-700'>
                  Redirect login will cause your work to be lost. We recommend exporting your work first.
                </div>
              </div>

              <Button onClick={handleExportAndLogin} className='w-full justify-start' size='lg'>
                <Download className='mr-2 h-4 w-4' />
                Export work, then use redirect login
                <span className='ml-auto text-xs text-muted-foreground'>Recommended</span>
              </Button>

              <Button onClick={handleRedirectLogin} variant='outline' className='w-full justify-start' size='lg'>
                <ExternalLink className='mr-2 h-4 w-4' />
                Use redirect login anyway
                <span className='ml-auto text-xs text-destructive'>Will lose changes</span>
              </Button>
            </div>
          ) : (
            <Button onClick={handleRedirectLogin} className='w-full justify-start' size='lg'>
              <ExternalLink className='mr-2 h-4 w-4' />
              Use redirect login
              <span className='ml-auto text-xs text-muted-foreground'>Safe - no unsaved work</span>
            </Button>
          )}

          <div className='pt-2'>
            <Button onClick={onClose} variant='outline' className='w-full'>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
