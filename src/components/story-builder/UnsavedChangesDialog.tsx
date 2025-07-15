'use client';

import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Cloud, Download, LogIn } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { openSaveDialog } from '@/app/state/save-dialog-actions';
import { exportState, discardChanges, resetInitialStoryState } from '@/app/state/actions';
import { StoryAtom } from '@/app/state/atoms';
import { startLogin } from '@/lib/auth-utils';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAndSave?: () => void;
  onExportLocally?: () => void;
  onDiscardChanges?: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onLoginAndSave,
  onExportLocally,
  onDiscardChanges,
}: UnsavedChangesDialogProps) {
  const auth = useAuth();
  const story = useAtomValue(StoryAtom);

  const handleSaveToCloud = () => {
    openSaveDialog({ saveType: 'session' });
    onClose();
  };

  const handleLoginAndSave = async () => {
    try {
      await startLogin();
      onLoginAndSave?.();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleExportLocally = async () => {
    try {
      await exportState(story);
      
      // Mark changes as saved since user has successfully exported
      resetInitialStoryState();
      
      onExportLocally?.();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDiscardChanges = () => {
    discardChanges();
    onDiscardChanges?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-500' />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes to your story. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 pt-4'>
          {auth.isAuthenticated ? (
            <div className='space-y-3'>
              <Button onClick={handleSaveToCloud} className='w-full justify-start' size='lg'>
                <Cloud className='mr-2 h-4 w-4' />
                Save to Cloud
                <span className='ml-auto text-xs text-muted-foreground'>Recommended</span>
              </Button>
              
              <Button
                onClick={handleExportLocally}
                variant='outline'
                className='w-full justify-start'
                size='lg'
              >
                <Download className='mr-2 h-4 w-4' />
                Export Locally
                <span className='ml-auto text-xs text-muted-foreground'>Backup option</span>
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              <Button
                onClick={handleExportLocally}
                className='w-full justify-start'
                size='lg'
              >
                <Download className='mr-2 h-4 w-4' />
                Export Locally
                <span className='ml-auto text-xs text-muted-foreground'>Recommended</span>
              </Button>
              
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-md text-sm'>
                <p className='text-blue-800 font-medium mb-1'>Want to save to cloud?</p>
                <p className='text-blue-700'>
                  1. Export your work locally first (button above)<br/>
                  2. Log in<br/>
                  3. Import your exported file (File → Import)<br/>
                  4. Save to cloud
                </p>
              </div>

              <Button
                onClick={handleLoginAndSave}
                variant='outline'
                className='w-full justify-start'
                size='lg'
              >
                <LogIn className='mr-2 h-4 w-4' />
                Log In (changes will be lost)
                <span className='ml-auto text-xs text-muted-foreground'>Not recommended</span>
              </Button>
            </div>
          )}

          <div className='pt-2 border-t'>
            <Button
              onClick={handleDiscardChanges}
              variant='ghost'
              className='w-full text-destructive hover:text-destructive'
            >
              Discard Changes
            </Button>
          </div>

          <div className='pt-2'>
            <Button onClick={onClose} variant='outline' className='w-full'>
              Continue Editing
            </Button>
          </div>
        </div>

        <div className='text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-md'>
          <p>
            <strong>Tip:</strong> {auth.isAuthenticated 
              ? 'Cloud saves are accessible from any device and can be shared with others. Local exports create a file on your computer for backup or offline use.'
              : 'Export your work locally to keep it safe, then log in and import it to save to the cloud. This prevents losing your changes during the login process.'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 