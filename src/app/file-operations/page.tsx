'use client';

import { useAuth } from '../providers';
import Link from 'next/link';
import { CRUDOperations } from '@/components/story-builder/file-operations/CRUDOperations';

export default function FileOperationsPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold'>File Operations</h1>
        <div className='flex items-center gap-4'>
          {auth.isAuthenticated ? (
            <>
              <span>Welcome {auth.user?.profile.email}</span>
              <button
                onClick={() => auth.removeUser()}
                className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
              >
                Logout
              </button>
            </>
          ) : (
            <Link href='/login' className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
              Login
            </Link>
          )}
        </div>
      </div>

      {auth.isAuthenticated ? (
        // Show full CRUD operations for authenticated users
        <CRUDOperations token={auth.user?.access_token || ''} userId={auth.user?.profile.sub || ''} />
      ) : (
        // Show only public read operations for non-authenticated users
        <CRUDOperations token='' userId='' publicOnly />
      )}
    </div>
  );
}
