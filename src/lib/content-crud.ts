import { getDefaultStore } from 'jotai';
import { toast } from 'sonner';
import { authenticatedFetch } from './auth/token-manager';
import { API_CONFIG } from './config';
import { encodeUint8ArrayToBase64 } from './data-utils';
import {
  MyStoriesDataAtom,
  StoryAtom,
  SharedStoryAtom,
  LastSharedStoryAtom,
} from '@/app/state/atoms';
import { getMVSData, cloneStory } from '@/app/state/actions';
import { Session, StoryItem } from '@/app/state/types';

/**
 * Delete a session by ID
 * Updates local state and shows success/error messages
 */
export async function deleteSession(sessionId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedSessions = (currentData['sessions-private'] as Session[]).filter(
      (session: Session) => session.id !== sessionId
    );

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'sessions-private': updatedSessions,
    });

    toast.success('Session deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Delete/unshare a story by ID
 * This is the same operation as unsharing since stories are public by default
 */
export async function deleteStory(storyId: string, isAuthenticated: boolean, isUnshareOperation = false) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${storyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to ${isUnshareOperation ? 'unshare' : 'delete'} story: ${response.statusText}`);
    }

    // Remove from local state
    const currentData = store.get(MyStoriesDataAtom);
    const updatedStories = (currentData['stories-public'] as StoryItem[]).filter(
      (story: StoryItem) => story.id !== storyId
    );

    store.set(MyStoriesDataAtom, {
      ...currentData,
      'stories-public': updatedStories,
    });

    // Reset shared story state if this was the currently shared story
    const sharedStory = store.get(SharedStoryAtom);
    if (sharedStory.storyId === storyId) {
      store.set(SharedStoryAtom, {
        isShared: false,
        storyId: undefined,
        publicUri: undefined,
        title: undefined,
      });
    }

    const successMessage = isUnshareOperation ? 'Story share removed successfully' : 'Story deleted successfully';
    toast.success(successMessage);
    return true;
  } catch (err) {
    console.error(`Error ${isUnshareOperation ? 'unsharing' : 'deleting'} story:`, err);
    const errorMessage = err instanceof Error ? err.message : `Failed to ${isUnshareOperation ? 'remove story share' : 'delete story'}`;
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Unshare a story - alias for deleteStory with unshare messaging
 * You're right - unshare and delete should be the same operation!
 */
export async function unshareStory(storyId: string, isAuthenticated: boolean) {
  return deleteStory(storyId, isAuthenticated, true);
}

/**
 * Update an existing shared story with current story data
 * Maintains the same story ID but updates content and metadata
 */
export async function updateSharedStory(storyId: string, isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const story = store.get(StoryAtom);

    // Prepare story data for update
    const data = await getMVSData(story);

    // Prepare request body for story update
    const requestBody: {
      title: string;
      description: string;
      data: unknown;
    } = {
      title: story.metadata.title || 'Untitled Story',
      description: '',
      data: undefined, // to be filled below
    };

    // Handle data based on type
    if (data instanceof Uint8Array) {
      requestBody.data = await encodeUint8ArrayToBase64(data);
    } else if (typeof data === 'string') {
      requestBody.data = JSON.parse(data);
    } else {
      requestBody.data = data;
    }

    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to update story: ${response.statusText}`);
    }

    // Set the last shared story to current state (but don't reset initial story state)
    store.set(LastSharedStoryAtom, cloneStory(story));

    // Update shared story state with new title
    const sharedStory = store.get(SharedStoryAtom);
    if (sharedStory.storyId === storyId) {
      store.set(SharedStoryAtom, {
        ...sharedStory,
        title: requestBody.title,
      });
    }

    toast.success('Story updated successfully!', {
      description: `Updated "${requestBody.title}"`,
    });

    return true;
  } catch (err) {
    console.error('Error updating story:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to update story';
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Delete all user content (sessions and stories)
 * Clears local state and shows success/error messages
 */
export async function deleteAllUserContent(isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/user/delete-all`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete all content: ${response.statusText}`);
    }

    // Clear local state
    const currentData = store.get(MyStoriesDataAtom);
    store.set(MyStoriesDataAtom, {
      ...currentData,
      'sessions-private': [],
      'stories-public': [],
    });

    toast.success('All content deleted successfully');
    return true;
  } catch (err) {
    console.error('Error deleting all content:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete all content';
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Delete all user sessions
 * Iterates through all sessions and deletes them individually
 */
export async function deleteAllSessions(isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const currentData = store.get(MyStoriesDataAtom);
    const sessions = currentData['sessions-private'] as Session[];

    if (sessions.length === 0) {
      toast.success('No sessions to delete');
      return true;
    }

    let successCount = 0;
    let failureCount = 0;

    // Delete all sessions individually
    for (const session of sessions) {
      try {
        const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${session.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Failed to delete session ${session.id}: ${response.statusText}`);
        }
      } catch (err) {
        failureCount++;
        console.error(`Error deleting session ${session.id}:`, err);
      }
    }

    // Update local state only for successfully deleted sessions
    if (successCount > 0) {
      store.set(MyStoriesDataAtom, {
        ...currentData,
        'sessions-private': [],
      });
    }

    if (failureCount === 0) {
      toast.success(`All ${successCount} sessions deleted successfully`);
      return true;
    } else if (successCount > 0) {
      toast.warning(`${successCount} sessions deleted, ${failureCount} failed`);
      return true;
    } else {
      toast.error(`Failed to delete all ${failureCount} sessions`);
      return false;
    }
  } catch (err) {
    console.error('Error deleting all sessions:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete all sessions';
    toast.error(errorMessage);
    return false;
  }
}

/**
 * Delete all user stories
 * Iterates through all stories and deletes them individually
 */
export async function deleteAllStories(isAuthenticated: boolean) {
  const store = getDefaultStore();

  if (!isAuthenticated) {
    toast.error('Authentication required');
    return false;
  }

  try {
    const currentData = store.get(MyStoriesDataAtom);
    const stories = currentData['stories-public'] as StoryItem[];

    if (stories.length === 0) {
      toast.success('No stories to delete');
      return true;
    }

    let successCount = 0;
    let failureCount = 0;

    // Delete all stories individually
    for (const story of stories) {
      try {
        const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/story/${story.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Failed to delete story ${story.id}: ${response.statusText}`);
        }
      } catch (err) {
        failureCount++;
        console.error(`Error deleting story ${story.id}:`, err);
      }
    }

    // Update local state only for successfully deleted stories
    if (successCount > 0) {
      // Clear shared story state if any deleted stories were shared
      const sharedStory = store.get(SharedStoryAtom);
      const deletedStoryIds = stories.map(s => s.id);
      if (sharedStory.storyId && deletedStoryIds.includes(sharedStory.storyId)) {
        store.set(SharedStoryAtom, {
          isShared: false,
          storyId: undefined,
          publicUri: undefined,
          title: undefined,
        });
      }

      store.set(MyStoriesDataAtom, {
        ...currentData,
        'stories-public': [],
      });
    }

    if (failureCount === 0) {
      toast.success(`All ${successCount} stories deleted successfully`);
      return true;
    } else if (successCount > 0) {
      toast.warning(`${successCount} stories deleted, ${failureCount} failed`);
      return true;
    } else {
      toast.error(`Failed to delete all ${failureCount} stories`);
      return false;
    }
  } catch (err) {
    console.error('Error deleting all stories:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete all stories';
    toast.error(errorMessage);
    return false;
  }
} 