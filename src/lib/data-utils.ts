import { getDefaultStore } from 'jotai';
import { StoryAtom, SharedStoryAtom, LastSharedStoryAtom } from '@/app/state/atoms';
import { cloneStory } from '@/app/state/actions';
import { StoryItem } from '@/app/state/types';
import { API_CONFIG } from './config';

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
export function checkIfCurrentStoryIsShared(sharedStories: StoryItem[]) {
  const store = getDefaultStore();
  const currentStory = store.get(StoryAtom);

  // Find a matching shared story by comparing metadata and content
  const matchingStory = sharedStories.find((sharedStory) => {
    // For now, we'll do a simple comparison based on title
    // In a more robust implementation, you might want to compare the actual story content
    return sharedStory.title === currentStory.metadata.title;
  });

  if (matchingStory) {
    // Use the public_uri from response and append /data?format=mvsj
    const correctPublicUri = matchingStory.public_uri
      ? `${matchingStory.public_uri}/data?format=mvsj`
      : `${API_CONFIG.baseUrl}/api/story/${matchingStory.id}/data?format=mvsj`;

    store.set(SharedStoryAtom, {
      isShared: true,
      storyId: matchingStory.id,
      publicUri: correctPublicUri,
      title: matchingStory.title,
    });

    // Set the last shared story to current state when a match is found
    store.set(LastSharedStoryAtom, cloneStory(currentStory));
  } else {
    // Clear shared story state if no match is found
    store.set(SharedStoryAtom, {
      isShared: false,
      storyId: undefined,
      publicUri: undefined,
      title: undefined,
    });
  }
} 