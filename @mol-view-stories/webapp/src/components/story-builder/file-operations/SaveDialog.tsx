'use client';

import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/app/providers';
import { SaveDialogAtom } from '@/app/state/atoms';
import { closeSaveDialog, updateSaveDialogFormField, performSaveSession } from '@/app/state/save-dialog-actions';

export function SaveDialog() {
  const auth = useAuth();
  const saveDialog = useAtomValue(SaveDialogAtom);

  // Check if we're updating an existing session
  const isEditingExistingSession = !!saveDialog.data?.sessionId;
  const isSaving = saveDialog.status === 'processing';

  return (
    <Dialog open={saveDialog.isOpen} onOpenChange={closeSaveDialog}>
      <DialogContent className='sm:max-w-[500px]' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Save Session</DialogTitle>
          <DialogDescription>Saved sessions are only accessible to you</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='description'>Note</Label>
            <Textarea
              id='description'
              placeholder='Add an optional note...'
              value={saveDialog.data?.note || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updateSaveDialogFormField('note', e.target.value)
              }
            />
          </div>
        </div>

        <div className='flex justify-end space-x-2'>
          {isEditingExistingSession && (
            <Button variant='outline' onClick={() => performSaveSession()} disabled={isSaving || !auth.isAuthenticated}>
              Save As New
            </Button>
          )}

          <Button
            onClick={() => performSaveSession(saveDialog.data?.sessionId)}
            disabled={isSaving || !auth.isAuthenticated}
          >
            {isSaving ? 'Saving...' : isEditingExistingSession ? 'Update Session' : 'Save Session'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
