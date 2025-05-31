'use client';

import { StoryAtom, addStoryAssets, modifySceneMetadata, removeStoryAsset } from '@/app/appstate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAtom, useAtomValue } from 'jotai';
import { Upload, Wrench, X, FileText, Code, FolderUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { StatefulInput } from '../controls';
import { Label } from '../ui/label';
import { StoryCodeEditor } from './editors/StoryCodeEditor';
import { Button } from '../ui/button';

export function StoryOptions() {
  return (
    <Tabs defaultValue='story-metadata' className='w-full h-full'>
      <Card className='w-full h-full'>
        <CardHeader className='border-b'>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Wrench className='h-4 w-4' />
              <CardTitle className='text-sm text-muted-foreground'>Story Options</CardTitle>
            </div>
            <TabsList>
              <TabsTrigger value='story-metadata'>
                <FileText className='size-4' /> Story Metadata
              </TabsTrigger>
              <TabsTrigger value='story-wide-code'>
                <Code className='size-4' /> Story-Wide Code
              </TabsTrigger>
              <TabsTrigger value='asset-upload'>
                <FolderUp className='size-4' /> Asset Upload
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <TabsContent value='story-metadata' className='mt-0 h-full'>
            <div className='space-y-4'>
              <Options />
            </div>
          </TabsContent>
          <TabsContent value='story-wide-code' className='mt-0 h-full'>
            <div className='space-y-4'>
              <Label>Common Code</Label>
              <StoryCodeEditor />
            </div>
          </TabsContent>
          <TabsContent value='asset-upload' className='mt-0 h-full'>
            <div className='space-y-4'>
              <Label>Assets</Label>
              <FileUploadZone />
              <AssetEditor />
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function Options() {
  const story = useAtomValue(StoryAtom);

  return (
    <div className='flex flex-col gap-2'>
      <div className='space-y-2'>
        <Label htmlFor='scene-header'>Title</Label>
        <StatefulInput
          id='story-title'
          value={story.metadata.title}
          placeholder='Story Title'
          onChange={(value) => {
            modifySceneMetadata({ title: value.trim() });
          }}
        />
      </div>
    </div>
  );
}

function AssetEditor() {
  const [story, setStory] = useAtom(StoryAtom);
  return (
    <div className='max-h-[200px] overflow-y-auto space-y-2'>
      {story.assets.map((asset, index) => (
        <div key={index} className='flex items-center gap-2'>
          <StatefulInput
            value={asset.name}
            placeholder='Asset Name'
            onChange={(value) => {
              const newAssets = [...story.assets];
              newAssets[index] = { ...newAssets[index], name: value.trim() };
              setStory((prev) => ({ ...prev, assets: newAssets }));
            }}
          />
          <span className='text-gray-500'>{Math.round(asset.content.length / 1024)}KB</span>
          <Button onClick={() => removeStoryAsset(asset.name)} title='Remove asset' variant='destructive'>
            <X />
          </Button>
        </div>
      ))}
    </div>
  );
}

function FileUploadZone() {
  const onDrop = async (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);

    const newAssets = await Promise.all(
      acceptedFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return {
          name: file.name,
          content: new Uint8Array(arrayBuffer),
        };
      })
    );

    addStoryAssets(newAssets);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'chemical/x-mmcif': ['.mmcif'],
      'chemical/x-cif': ['.cif'],
      'chemical/x-pdb': ['.pdb'],
      'application/octet-stream': ['.bcif'],
      'chemical/x-mdl-molfile': ['.mol'],
      'chemical/x-mdl-sdfile': ['.sdf'],
    },
  });

  return (
    <div className='space-y-4'>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className='h-12 w-12 text-gray-400 mb-4' />
        {isDragActive ? (
          <p className='text-blue-600'>Drop the files here...</p>
        ) : (
          <div className='space-y-2'>
            <p className='text-gray-600'>Drag & drop files here, or click to select files</p>
            <p className='text-sm text-gray-400'>
              Supports molecular structure files (mmCIF, CIF, PDB, BCIF, MOL, SDF)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
