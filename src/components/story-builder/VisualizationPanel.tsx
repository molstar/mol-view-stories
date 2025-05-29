'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import Markdown from 'react-markdown';
import { useAtomValue } from 'jotai';
import { ActiveSceneAtom } from '@/app/appstate';

interface VisualizationPanelProps {
  className?: string;
}

// Import MolStar dynamically to avoid SSR rendering
const CurrentSceneView = dynamic(() => import('./CurrentSceneView'), { ssr: false });

function MarkdownRenderer() {
  const scene = useAtomValue(ActiveSceneAtom);
  return <Markdown skipHtml>{scene?.description || ''}</Markdown>;
}

export function VisualizationPanel({ className }: VisualizationPanelProps) {
  // NOTE: currently unused
  const [activeTab, setActiveTab] = useState('molstar');

  return (
    <Card className={`h-full flex flex-col ${className || ''}`}>
      <CardHeader className='border-b'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Eye className='h-4 w-4' />
            <CardTitle className='text-sm text-muted-foreground'>Visualization</CardTitle>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='molstar'>3D View</TabsTrigger>
              <TabsTrigger value='markdown'>Markdown</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='flex-1 p-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full'>
          <TabsContent value='molstar' className='h-full'>
            <div className='w-full' style={{ aspectRatio: '1.3/1' }}>
              <CurrentSceneView />
            </div>
          </TabsContent>
          <TabsContent value='markdown' className='h-full'>
            <div className='h-full min-h-[500px] max-h-[500px] bg-gray-50 rounded-lg p-4 overflow-y-auto'>
              <div className='prose'>
                <MarkdownRenderer />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
