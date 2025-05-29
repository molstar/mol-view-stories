'use client';

import { ActiveSceneAtom } from '@/app/appstate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAtomValue } from 'jotai';
import { Edit, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';
import { Label } from '../ui/label';
import { CameraControls } from './CameraControls';
import { MonacoEditorJS } from './editors/MonacoCodeEditor';
import { MonacoMarkdownEditor } from './editors/MonacoMarkdownEditor';
import { OptionsEditor } from './editors/Options';
import { CurrentSceneView } from './CurrentSceneView';

export function SceneEditors() {
  return (
    <Tabs defaultValue='scene' className='w-full h-full'>
      <Card className='w-full h-full'>
        <CardHeader className='border-b'>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Edit className='h-4 w-4' />
              <CardTitle className='text-sm text-muted-foreground'>Scene Editor</CardTitle>
            </div>
            <TabsList className='grid grid-cols-3'>
              <TabsTrigger value='scene'>3D View</TabsTrigger>
              <TabsTrigger value='description'>Description</TabsTrigger>
              <TabsTrigger value='upload'>Upload</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <TabsContent value='description' className='mt-0 h-full'>
            <div className='space-y-4'>
              <OptionsEditor />
              <Label>Markdown Description</Label>
              <div className='flex gap-6'>
                <div className='flex-1'>
                  <MonacoMarkdownEditor />
                </div>
                <div className='flex-1'>
                  <MarkdownRenderer />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='scene' className='mt-0 h-full'>
            <div className='flex gap-6'>
              <div className='space-y-4 flex-1'>
                <CameraControls />
                <MonacoEditorJS />
              </div>
              <div className='flex-1'>
                <div className='w-full' style={{ aspectRatio: '1.3/1' }}>
                  <CurrentSceneView />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='upload' className='mt-0 h-full'>
            <div className='space-y-4'>
              <Label>File Upload</Label>
              <FileUploadZone />
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function MarkdownRenderer() {
  const scene = useAtomValue(ActiveSceneAtom);
  return (
    <div className='h-full min-h-[500px] max-h-[500px] bg-gray-50 rounded-lg p-4 overflow-y-auto'>
      <div className='prose'>
        <Markdown skipHtml>{scene?.description || ''}</Markdown>
      </div>
    </div>
  );
}

function FileUploadZone() {
  const onDrop = (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    // Handle file upload logic here
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
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[400px] flex flex-col items-center justify-center ${
        isDragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
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
  );
}
