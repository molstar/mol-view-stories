'use client';

import { useAtomValue } from 'jotai';
import { getDefaultStore } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/app/providers';
import { SaveDialogAtom, SaveFormData } from '@/app/state/atoms';
import { closeSaveDialog, updateSaveDialogFormField, performSave } from '@/app/state/save-dialog-actions';

export function SaveDialog() {
  const auth = useAuth();
  const saveDialog = useAtomValue(SaveDialogAtom);

  const handleFieldChange = (field: keyof SaveFormData, value: string) => {
    updateSaveDialogFormField(field, value);
  };

  const handleSaveAs = async () => {
    // Temporarily clear sessionId to force creating a new session, then save immediately
    const store = getDefaultStore();
    const currentSaveDialog = store.get(SaveDialogAtom);

    // Temporarily clear sessionId to create new session
    store.set(SaveDialogAtom, { ...currentSaveDialog, sessionId: undefined });

    // Perform the save immediately
    const success = await performSave();

    // If save failed, restore the original sessionId
    if (!success) {
      store.set(SaveDialogAtom, { ...currentSaveDialog });
    }
  };

  // Check if we're updating an existing session
  const isEditingExistingSession = saveDialog.saveType === 'session' && !!saveDialog.sessionId;

  return (
    <Dialog open={saveDialog.isOpen} onOpenChange={closeSaveDialog}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{saveDialog.saveType === 'session' ? 'Save Session' : 'Share Story'}</DialogTitle>
          <DialogDescription>
            {saveDialog.saveType === 'session' &&
              'Save your session to the cloud for later access. You can add a note to help you remember what this session contains.'}
            {saveDialog.saveType === 'story' && 'Share your story with the world'}
          </DialogDescription>
        </DialogHeader>

        {saveDialog.saveType === 'session' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='description'>Note</Label>
              <Textarea
                id='description'
                placeholder='Add a note to help you remember what this session contains (optional)'
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleFieldChange('description', e.target.value)
                }
              />
            </div>
          </div>
        )}

        {saveDialog.saveType === 'story' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                placeholder='Enter state title'
                value={saveDialog.formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Note</Label>
              <Textarea
                id='description'
                placeholder='Enter state description'
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleFieldChange('description', e.target.value)
                }
              />
            </div>
          </div>
        )}

        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={closeSaveDialog} disabled={saveDialog.isSaving}>
            Cancel
          </Button>

          {isEditingExistingSession && (
            <Button variant='outline' onClick={handleSaveAs} disabled={saveDialog.isSaving || !auth.isAuthenticated}>
              Save As New
            </Button>
          )}

          <Button onClick={performSave} disabled={saveDialog.isSaving || !auth.isAuthenticated}>
            {saveDialog.isSaving
              ? 'Saving...'
              : isEditingExistingSession
                ? 'Update Session'
                : `${saveDialog.saveType === 'session' ? 'Save Session' : 'Share Story'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
