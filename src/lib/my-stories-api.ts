import { getDefaultStore } from 'jotai';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authenticatedFetch } from './auth/token-manager';
import { API_CONFIG } from './config';
import { tryFindIfStoryIsShared } from './data-utils';
import {
  MyStoriesDataAtom,
  MyStoriesStatusAtom,
  StoryAtom,
  CurrentViewAtom,
  IsSessionLoadingAtom,
  PublishedStoryModalAtom,
} from '@/app/state/atoms';
import { checkCurrentStoryAgainstSharedStories } from '@/app/state/actions';
import { SessionItem, StoryItem } from '@/app/state/types';
import { VERSION as STORIES_APP_VERSION } from 'molstar/lib/apps/mvs-stories/version';

export function resolvePublicStoryUrl(storyId: string) {
  // TODO: how to handle the format?
  return `${API_CONFIG.baseUrl}/api/story/${storyId}/data`;
}

export function resolveViewerUrl(storyId: string, storyFormat: 'mvsx' | 'mvsj') {
  const appPrefix = `https://molstar.org/stories-viewer/v${STORIES_APP_VERSION}`;

  if (API_CONFIG.baseUrl === 'https://stories.molstar.org') {
    return `${appPrefix}?story-id=${storyId}&format=${storyFormat}`;
  }

  const storyUrl = `${API_CONFIG.baseUrl}/api/story/${storyId}/data`;
  return `${appPrefix}/?story-url=${encodeURIComponent(storyUrl)}&format=${storyFormat}`;
}

/**
 * Fetch user stories data from a specific endpoint
 * Returns empty array if not authenticated or on error
 */
export async function fetchMyStoriesData(endpoint: string, isAuthenticated: boolean) {
  if (!isAuthenticated) return [];

  try {
    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/${endpoint}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${endpoint}`;
    toast.error(errorMessage);
    return [];
  }
}

/**
 * Load all user's stories data (sessions and public stories) in parallel
 * Updates the global state with the fetched data
 */
export function loadAllMyStoriesData(isAuthenticated: boolean) {
  const store = getDefaultStore();

  // Set loading state
  store.set(MyStoriesStatusAtom, { status: 'loading' });

  // Fetch all data in parallel
  Promise.all([
    fetchMyStoriesData('session', isAuthenticated), // Sessions are always private, require auth
    fetchMyStoriesData('story', isAuthenticated), // Stories are always public, but we still need auth to create/manage them
  ])
    .then(([sessionsPrivate, storiesPublic]) => {
      const data = {
        'sessions-private': sessionsPrivate,
        'stories-public': storiesPublic,
      };
      store.set(MyStoriesDataAtom, data);
      store.set(MyStoriesStatusAtom, { status: 'success', data });

      // Check if current story matches any shared stories
      tryFindIfStoryIsShared(storiesPublic);
    })
    .catch((error) => {
      console.error('Error loading my stories data:', error);
      store.set(MyStoriesStatusAtom, { status: 'error', error: error.message });
    });
}

/**
 * Load a specific session by ID into the story builder
 * Updates global state with the session's story data
 *
 * Session Context Persistence Strategy:
 * - Stores sessionId in sessionStorage to survive page refreshes
 * - URL params are cleaned after loading to prevent browser history issues
 * - Session context is restored on component mount if no URL params present
 * - Context is cleared when starting fresh (new story, template, import, error)
 */
export async function loadSession(sessionId: string) {
  const store = getDefaultStore();
  try {
    store.set(IsSessionLoadingAtom, true);

    const response = await authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}/data`);

    if (!response.ok) {
      throw new Error(`Failed to fetch session data: ${response.statusText}`);
    }

    const sessionResponse = await response.json();
    const storyData = sessionResponse;

    if (storyData?.story) {
      store.set(StoryAtom, storyData.story);
      store.set(CurrentViewAtom, { type: 'story-options', subview: 'story-metadata' });
      // Check if this story matches any shared stories
      checkCurrentStoryAgainstSharedStories();
    } else {
      throw new Error('No story data found in session');
    }
  } catch (err) {
    console.error('Error loading session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
    toast.error(errorMessage);
  } finally {
    store.set(IsSessionLoadingAtom, false);
  }
}

/**
 * Open a session or story item in the appropriate viewer
 * Sessions open in the builder, stories open in external MVS viewer
 */
export async function openItemInBuilder(router: ReturnType<typeof useRouter>, item: SessionItem | StoryItem) {
  try {
    // For sessions, try to load story data into the builder
    if (item.type === 'session') {
      router.push(`/builder/?sessionId=${item.id}`);
    } else if (item.type === 'story') {
      const store = getDefaultStore();
      store.set(PublishedStoryModalAtom, {
        isOpen: true,
        status: 'success',
        data: {
          itemId: item.id,
          itemType: 'story',
          itemTitle: item.title,
        },
      });
    } else {
      toast.error('Unknown item type');
    }
  } catch (err) {
    console.error('Error opening item:', err);
    toast.error(err instanceof Error ? err.message : 'Failed to open item');
  }
}
