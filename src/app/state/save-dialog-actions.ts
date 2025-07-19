import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, PublishedStoryModalAtom } from './atoms';
import { type Story, type StoryContainer } from './types';
import { authenticatedFetch } from '@/lib/auth/token-manager';
import { API_CONFIG } from '@/lib/config';
import { encodeUint8ArrayToBase64 } from '@/lib/data-utils';
import { getMVSData, setIsDirty } from './actions';

// SaveDialog Actions
export function openSaveDialog() {
  const sessionId = new URL(window.location.href).searchParams.get('sessionId') ?? undefined;
  const store = getDefaultStore();

  store.set(SaveDialogAtom, {
    isOpen: true,
    status: 'idle',
    data: {
      sessionId,
      // TODO: set note from the current session
      note: '',
    },
  });
}

export function closeSaveDialog() {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);
  store.set(SaveDialogAtom, { ...current, isOpen: false });
}

export function updateSaveDialogFormField(field: 'note', value: string) {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);

  store.set(SaveDialogAtom, {
    ...current,
    data: { ...current.data, [field]: value },
  });
}

// Direct share story function - saves as public story and shows share modal
export async function publishStory(options?: { storyId?: string }): Promise<boolean> {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);

  // Prepare form data for story save
  const formData = {
    title: story.metadata.title || 'Untitled Story',
    description: '',
    // Note: No visibility field needed - stories are always public
  };

  try {
    // Prepare story data
    const data = await prepareStateData(story);

    // Save to API
    const result = await saveToAPI(data, 'story', formData, options?.storyId);

    toast.success('Story shared successfully!', {
      description: `Shared as "${formData.title}"`,
    });

    console.log('Share result:', result);

    // Show the share modal
    if (result.id) {
      store.set(PublishedStoryModalAtom, {
        isOpen: true,
        status: 'success',
        data: {
          itemId: result.id,
          itemTitle: formData.title,
          itemType: 'story',
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Share failed:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to share story');
    return false;
  }
}

async function prepareSessionData(story: Story): Promise<Uint8Array> {
  const container: StoryContainer = {
    version: 1,
    story,
  };

  // Using message pack for efficient encoding
  const encoded = encodeMsgPack(container);
  const deflated = await Task.create('Deflate Story Data', async (ctx) => {
    return await deflate(ctx, encoded, { level: 3 });
  }).run();

  return deflated;
}

async function prepareStateData(story: Story): Promise<Uint8Array | string> {
  const mvsData = await getMVSData(story);

  if (mvsData instanceof Uint8Array) {
    return mvsData;
  } else {
    // Convert to JSON string for API
    return JSON.stringify(mvsData);
  }
}

async function saveToAPI(
  data: Uint8Array | string,
  endpoint: string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  // Determine correct file extension based on endpoint
  const getFileExtension = (endpoint: string, data: Uint8Array | string) => {
    if (endpoint === 'session') {
      return '.mvstory';
    } else {
      // For stories, use .mvsj for JSON data, .mvsx for binary data
      return data instanceof Uint8Array ? '.mvsx' : '.mvsj';
    }
  };

  const requestBody: {
    title: string;
    description: string;
    data: unknown;
    filename?: string;
  } = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    // Note: No visibility field - sessions are always private, stories are always public
    data: undefined, // to be filled below
  };

  // Handle data based on type - async for Uint8Array
  if (data instanceof Uint8Array) {
    requestBody.data = await encodeUint8ArrayToBase64(data);
  } else if (typeof data === 'string') {
    requestBody.data = JSON.parse(data);
  } else {
    requestBody.data = data;
  }

  // Only include filename for new sessions (POST), not updates (PUT)
  if (!sessionId) {
    requestBody.filename = formData.title.trim() + getFileExtension(endpoint, data);
  }

  // If sessionId is provided, update existing session; otherwise create new
  const url = sessionId
    ? `${API_CONFIG.baseUrl}/api/${endpoint}/${sessionId}`
    : `${API_CONFIG.baseUrl}/api/${endpoint}`;
  const method = sessionId ? 'PUT' : 'POST';

  const response = await authenticatedFetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save ${endpoint}: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

export async function performSaveSession(sessionId?: string): Promise<boolean> {
  const store = getDefaultStore();
  const saveDialog = store.get(SaveDialogAtom);
  const story = store.get(StoryAtom);

  const formData = {
    title: story.metadata.title || 'Untitled Session',
    description: saveDialog.data?.note || '',
  };

  // Set saving state
  store.set(SaveDialogAtom, { ...saveDialog, status: 'processing' });

  try {
    const data = await prepareSessionData(story);
    const result = await saveToAPI(data, 'session', formData, sessionId);

    const isUpdate = !!sessionId;
    const actionText = isUpdate ? 'updated' : 'saved';

    toast.success(`Session ${actionText} successfully!`, {
      description: `${isUpdate ? 'Updated' : 'Saved as'} "${formData.title}"`,
      action: {
        label: 'View My Stories →',
        onClick: () => (window.location.href = '/my-stories'),
      },
    });

    setIsDirty(false);
    closeSaveDialog();

    if (result.id) {
      const url = new URL(window.location.href);
      url.searchParams.set('sessionId', result.id);
      window.history.replaceState({}, '', url.toString());
    }

    return true;
  } catch (error) {
    console.error('Save failed:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to save');
    return false;
  } finally {
    // Reset saving state
    const current = store.get(SaveDialogAtom);
    store.set(SaveDialogAtom, { ...current, status: 'idle' });
  }
}
