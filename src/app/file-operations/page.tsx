"use client";

import { useAuth } from "../providers";
import Link from "next/link";

export default function FileOperationsPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Not Authenticated</h2>
          <p className="text-gray-600 mb-4">Please sign in to access file operations.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">File Operations</h1>
      <div className="mb-4">
        <p>Welcome {auth.user?.profile.email}</p>
        <pre>{JSON.stringify(auth.user?.profile, null, 2)}</pre>
        <button 
          onClick={() => auth.removeUser()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 