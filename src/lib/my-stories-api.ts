import { importState } from '@/app/state/actions';
import {
  IsSessionLoadingAtom,
  MyStoriesDataAtom,
  MyStoriesStatusAtom,
  PublishedStoryModalAtom,
} from '@/app/state/atoms';
import { SessionItem, StoryItem } from '@/app/state/types';
import { getDefaultStore } from 'jotai';
import { VERSION as STORIES_APP_VERSION } from 'molstar/lib/apps/mvs-stories/version';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authenticatedFetch } from './auth/token-manager';
import { API_CONFIG } from './config';
import { base64toUint8Array, tryFindIfStoryIsShared } from './data-utils';

export function resolvePublicStoryUrl(storyId: string) {
  // TODO: how to handle the format?
  return `${API_CONFIG.baseUrl}/api/story/${storyId}/data`;
}

export function resolveViewerUrl(storyId: string, storyFormat: 'mvsx' | 'mvsj') {
  const appPrefix = `https://molstar.org/stories-viewer/v${STORIES_APP_VERSION}`;

  if (API_CONFIG.baseUrl === 'https://stories.molstar.org') {
    return `${appPrefix}?story-id=${storyId}&data-format=${storyFormat}`;
  }

  const storyUrl = `${API_CONFIG.baseUrl}/api/story/${storyId}/data`;
  return `${appPrefix}/?story-url=${encodeURIComponent(storyUrl)}&data-format=${storyFormat}`;
}

/**
 * Fetch the format (mvsj or mvsx) of a story by ID
 * This endpoint doesn't require authentication
 */
export async function fetchStoryFormat(storyId: string): Promise<'mvsj' | 'mvsx'> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/story/${storyId}/format`);

    if (!response.ok) {
      console.warn(`Failed to fetch story format for ${storyId}: ${response.statusText}`);
      // Fallback to 'mvsj' if the request fails
      return 'mvsj';
    }

    const data = await response.json();
    const format = data.format;

    if (format !== 'mvsj' && format !== 'mvsx') {
      console.warn(`Invalid format received: ${format}, falling back to 'mvsj'`);
      return 'mvsj';
    }

    return format;
  } catch (err) {
    console.warn(`Error fetching story format for ${storyId}:`, err);
    // Fallback to 'mvsj' if there's an error
    return 'mvsj';
  }
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
 * Updates global state with the session's story data and metadata
 */
export async function loadSession(sessionId: string) {
  const store = getDefaultStore();
  try {
    store.set(IsSessionLoadingAtom, true);

    // Fetch both session data and metadata in parallel
    const [dataResponse, metadataResponse] = await Promise.all([
      authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}/data`),
      authenticatedFetch(`${API_CONFIG.baseUrl}/api/session/${sessionId}`),
    ]);

    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch session data: ${dataResponse.statusText}`);
    }

    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch session metadata: ${metadataResponse.statusText}`);
    }

    // Parse session data
    const sessionResponse = await dataResponse.json();
    const bytes = base64toUint8Array(sessionResponse);
    await importState(new Blob([bytes]), {
      throwOnError: true,
      doNotCleanSessionId: true,
    });
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
export async function navigateToMyStoriesItem(router: ReturnType<typeof useRouter>, item: SessionItem | StoryItem) {
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
