import { StoryAtom } from '@/app/state/atoms';
import { StoryItem } from '@/app/state/types';
import { getDefaultStore } from 'jotai';

/**
 * Helper function to safely encode large Uint8Array to base64
 * Uses FileReader API to handle large binary data efficiently
 */
export function encodeUint8ArrayToBase64(data: Uint8Array): Promise<string> {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data: prefix
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if the current story matches any of the user's shared stories
 * Updates the shared story state if a match is found
 * Only called when explicitly loading user data, not after session saves
 */
export function tryFindIfStoryIsShared(sharedStories: StoryItem[]) {
  const store = getDefaultStore();
  const currentStory = store.get(StoryAtom);

  // Find a matching shared story by comparing metadata and content
  return sharedStories.find((sharedStory) => {
    // For now, we'll do a simple comparison based on title
    // In a more robust implementation, you might want to compare the actual story content
    return sharedStory.title === currentStory.metadata.title;
  });
}

/**
 * Utility to decode base64 (browser safe)
 */
export function decodeBase64(base64: string): string {
  if (typeof window !== 'undefined' && window.atob) {
    return window.atob(base64);
  } else {
    // Node.js fallback
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}

export function base64toUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
