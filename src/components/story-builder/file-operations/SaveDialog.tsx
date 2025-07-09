'use client';

import { useAtomValue } from 'jotai';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/app/providers';
import {
  SaveDialogAtom,
} from '@/app/state/atoms';
import {
  closeSaveDialog,
  updateSaveDialogFormField,
  setSaveDialogType,
  performSave,
} from '@/app/state/save-dialog-actions';

export function SaveDialog() {
  const auth = useAuth();
  const saveDialog = useAtomValue(SaveDialogAtom);

  const handleFieldChange = (field: string, value: string) => {
    updateSaveDialogFormField(field as any, value);
  };

  const handleSave = async () => {
    await performSave();
  };

  const handleClose = () => {
    closeSaveDialog();
  };

  const handleTabChange = (value: string) => {
    setSaveDialogType(value as 'session' | 'state');
  };

  return (
    <Dialog open={saveDialog.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save {saveDialog.saveType === 'session' ? 'Session' : 'State'}</DialogTitle>
          <DialogDescription>
            Save your {saveDialog.saveType === 'session' ? 'session' : 'state'} to the cloud for later access.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={saveDialog.saveType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
          </TabsList>
          
          <TabsContent value="session" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter session title"
                value={saveDialog.formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter session description"
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={saveDialog.formData.visibility} onValueChange={(value) => handleFieldChange('visibility', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas"
                value={saveDialog.formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="state" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter state title"
                value={saveDialog.formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter state description"
                value={saveDialog.formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('description', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={saveDialog.formData.visibility} onValueChange={(value) => handleFieldChange('visibility', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Enter tags separated by commas"
                value={saveDialog.formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={saveDialog.isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveDialog.isSaving || !auth.isAuthenticated}>
            {saveDialog.isSaving ? 'Saving...' : `Save ${saveDialog.saveType === 'session' ? 'Session' : 'State'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 