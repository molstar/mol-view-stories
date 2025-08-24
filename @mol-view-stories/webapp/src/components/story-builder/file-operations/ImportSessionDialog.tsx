'use client';

import { OpenSessionAtom } from '@/app/appstate';
import { importState } from '@/app/state/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SessionFileExtension } from '@mol-view-stories/lib/src/actions';
import { useAtom } from 'jotai';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function ImportSessionDialog() {
  const [isOpen, setIsOpen] = useAtom(OpenSessionAtom);
  // TODO: there is a lot better way to do this with "useAsyncAction"-like hook
  // ...perhaps add that later and use it wherever we handle async actions
  const [status, setStatus] = useState<{ kind: 'loading' } | { kind: 'error'; message: string } | null>();

  useEffect(() => {
    if (isOpen) {
      setStatus(null);
    }
  }, [isOpen]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      console.warn('No files accepted for import');
      setIsOpen(false);
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      await importState(acceptedFiles[0]);
      setIsOpen(false);
    } catch (err) {
      console.error('Error importing session:', err);
      setStatus({ kind: 'error', message: 'Failed to import session. Please ensure the file is valid.' });
    } finally {
      setStatus(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: status?.kind === 'loading',
    accept: {
      'application/octet-stream': [SessionFileExtension],
    },
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent onClose={() => setIsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Import Session</DialogTitle>
          <div className='space-y-4'>
            {status?.kind === 'error' && <p className='text-red-500'>{status.message}</p>}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className='h-12 w-12 text-gray-400 mb-4' />
              {isDragActive ? (
                <p className='text-blue-600'>Drop the file here...</p>
              ) : (
                <div className='space-y-2'>
                  <p className='text-gray-600'>Drag & drop session file here, or click to select files</p>
                  <p className='text-sm text-gray-400'>{SessionFileExtension}</p>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
