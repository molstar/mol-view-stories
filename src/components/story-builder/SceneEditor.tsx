'use client';

import { ActiveSceneAtom } from '@/app/appstate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAtomValue } from 'jotai';
import { Edit } from 'lucide-react';
import Markdown from 'react-markdown';

import { Label } from '../ui/label';
import { CameraControls } from './CameraControls';
import { CurrentSceneView } from './CurrentSceneView';
import { SceneCodeEditor } from './editors/SceneCodeEditor';
import { SceneMarkdownEditor } from './editors/SceneMarkdownEditor';
import { OptionsEditor } from './editors/SceneOptions';
import { BoxIcon, BoltIcon } from 'lucide-react';

export function SceneEditors() {
  return (
    <Tabs defaultValue='scene' className='w-full h-full'>
      <Card className='w-full h-full'>
        <CardHeader className='border-b'>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Edit className='h-4 w-4' />
              <CardTitle className='text-sm text-muted-foreground'>
                <SceneTitle />
              </CardTitle>
            </div>
            <TabsList>
              <TabsTrigger value='scene'>
                <BoxIcon className='size-4' /> 3D View
              </TabsTrigger>
              <TabsTrigger value='options'>
                <BoltIcon className='size-4' /> Scene Options
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className='flex-1 overflow-hidden'>
          <TabsContent value='options' className='mt-0 h-full'>
            <div className='space-y-4'>
              <OptionsEditor />
              <Label>Markdown Description</Label>
              <div className='flex gap-6'>
                <div className='flex-1'>
                  <SceneMarkdownEditor />
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
                <SceneCodeEditor />
              </div>
              <div className='flex-1'>
                <div className='w-full' style={{ aspectRatio: '1.3/1' }}>
                  <CurrentSceneView />
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

function SceneTitle() {
  const scene = useAtomValue(ActiveSceneAtom);
  return <>{scene?.header || 'Untitled Scene'}</>;
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
