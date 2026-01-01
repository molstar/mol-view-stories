'use client';

import { SceneAsset, StoryAtom, addStoryAssets, modifySceneMetadata, removeStoryAsset } from '@/app/appstate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAtom, useAtomValue } from 'jotai';
import { Upload, Wrench, X, FileText, Code, FolderUp, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ImmediateInput } from '../controls';
import { Label } from '../ui/label';
import { StoryCodeEditor } from './editors/StoryCodeEditor';
import { Button } from '../ui/button';
import { PressToCodeComplete, PressToSave } from '../common';
import { Textarea } from '../ui/textarea';
import { download } from 'molstar/lib/mol-util/download';

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
            <div className='h-full'>
              <Options />
            </div>
          </TabsContent>
          <TabsContent value='story-wide-code' className='mt-0 h-full'>
            <StoryCodeEditorTab />
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

function StoryCodeEditorTab() {
  const [story, setStory] = useAtom(StoryAtom);

  return (
    <div className='space-y-2 flex flex-col h-full'>
      <Label>Common Code</Label>
      <div className='flex-1 relative border rounded'>
        <StoryCodeEditor
          value={story.javascript || ''}
          onSave={(code) => setStory((prev) => ({ ...prev, javascript: code }))}
        />
      </div>
      <div className='flex gap-2'>
        <PressToSave />
        <PressToCodeComplete />
      </div>
    </div>
  );
}

function Options() {
  const story = useAtomValue(StoryAtom);

  return (
    <div className='flex flex-col gap-4 h-full'>
      <div className='space-y-2'>
        <Label htmlFor='story-title'>Title</Label>
        <ImmediateInput
          id='story-title'
          value={story.metadata.title}
          placeholder='Story Title'
          onChange={(value) => {
            modifySceneMetadata({ title: value });
          }}
        />
      </div>
      <div className='space-y-2 flex-1 flex flex-col'>
        <Label htmlFor='story-author-note'>Author Note</Label>
        <Textarea
          id='story-author-note'
          value={story.metadata.author_note || ''}
          className='flex-1 resize-none'
          placeholder='Optional note stored with the story session, e.g., an explanation of how the story was created'
          onChange={(e) => {
            modifySceneMetadata({ author_note: e.target.value || undefined });
          }}
        />
      </div>
    </div>
  );
}

function downloadAsset(asset: SceneAsset) {
  const blob = new Blob([asset.content as Uint8Array<ArrayBuffer>]);
  download(blob, asset.name);
}

function AssetEditor() {
  const [story, setStory] = useAtom(StoryAtom);
  return (
    <div className='max-h-[200px] overflow-y-auto space-y-2'>
      {story.assets.map((asset, index) => (
        <div key={index} className='flex items-center gap-2'>
          <ImmediateInput
            value={asset.name}
            placeholder='Asset Name'
            onChange={(value) => {
              const newAssets = [...story.assets];
              newAssets[index] = { ...newAssets[index], name: value };
              setStory((prev) => ({ ...prev, assets: newAssets }));
            }}
          />
          <span className='text-gray-500'>{Math.round(asset.content.length / 1024)}KB</span>
          <Button onClick={() => downloadAsset(asset)} title='Download' variant='default'>
            <Download />
          </Button>
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
      // Molecules
      'chemical/x-mmcif': ['.mmcif'],
      'chemical/x-cif': ['.cif'],
      'chemical/x-pdb': ['.pdb', '.pdbqt'],
      'application/octet-stream': ['.bcif'],
      'chemical/x-mdl-molfile': ['.mol'],
      'chemical/x-mdl-sdfile': ['.sdf'],
      'chemical/x-xyz': ['.xyz'],
      'chemical/x-gro': ['.gro'],
      'chemical/x-mol2': ['.mol2'],
      'chemical/x-lammpstrj': ['.lammpstrj'],
      'application/x-xtc': ['.xtc'],
      // Volumes
      'application/x-map': ['.map'],
      'application/x-dx': ['.dx'],
      'application/x-dxbin': ['.dxbin'],
      // Images
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      // Audio
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      // JSON
      'application/json': ['.json'],
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
            <div className='text-sm text-gray-400'>
              <ul className='list-disc list-inside text-left'>
                <li>
                  Molecular: Structure (mmCIF, CIF, PDB, BCIF, MOL, SDF, XYZ, GRO, MOL2), Coordinates (LAMMPSTRJ, XTC),
                  Volumes (MAP, DX, DXBIN)
                </li>
                <li>Media: Images (PNG, JPG, GIF, WEBP), Audio (MP3, WAV, OGG)</li>
                <li>Raw data: JSON</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
