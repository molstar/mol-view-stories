'use client';

import { useAtomValue } from 'jotai';
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

  return (
    <Dialog open={saveDialog.isOpen} onOpenChange={closeSaveDialog}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{saveDialog.saveType === 'session' ? 'Save Session' : 'Share Story'}</DialogTitle>
          <DialogDescription>
            {saveDialog.saveType === 'session' && 'Save your session to the cloud for later access'}
            {saveDialog.saveType === 'state' && 'Share your story with the world'}
          </DialogDescription>
        </DialogHeader>

        {saveDialog.saveType === 'session' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                placeholder='Enter session title'
                value={saveDialog.formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Enter session description'
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleFieldChange('description', e.target.value)
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='tags'>Tags</Label>
              <Input
                id='tags'
                placeholder='Enter tags separated by commas'
                value={saveDialog.formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
              />
            </div>
          </div>
        )}

        {saveDialog.saveType === 'state' && (
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
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Enter state description'
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleFieldChange('description', e.target.value)
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='tags'>Tags</Label>
              <Input
                id='tags'
                placeholder='Enter tags separated by commas'
                value={saveDialog.formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className='flex justify-end space-x-2'>
          <Button variant='outline' onClick={closeSaveDialog} disabled={saveDialog.isSaving}>
            Cancel
          </Button>
          <Button onClick={performSave} disabled={saveDialog.isSaving || !auth.isAuthenticated}>
            {saveDialog.isSaving
              ? 'Saving...'
              : `${saveDialog.saveType === 'session' ? 'Save Session' : 'Share Story'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
