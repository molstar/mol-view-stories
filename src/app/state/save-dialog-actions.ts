import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, PublishedStoryModalAtom, type SaveType } from './atoms';
import { type Story, type StoryContainer } from './types';
import { authenticatedFetch } from '@/lib/auth/token-manager';
import { API_CONFIG } from '@/lib/config';
import { encodeUint8ArrayToBase64 } from '@/lib/data-utils';
import { getMVSData } from './actions';

// encodeUint8ArrayToBase64 is imported from @/lib/data-utils

// SaveDialog Actions
export function openSaveDialog(options: {
  saveType: SaveType;
  sessionId: string | undefined | null;
  saveAsNew?: boolean;
}) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const currentSessionId = options?.sessionId;

  const formData = {
    title: story.metadata.title || 'Untitled Session',
    description: '',
  };

  // Determine the session ID: use provided sessionId, or current session (unless saveAsNew is true)
  let sessionId = options.sessionId;
  if (!sessionId && !options.saveAsNew && options.saveType === 'session') {
    sessionId = currentSessionId || undefined;
  }

  store.set(SaveDialogAtom, {
    isOpen: true,
    status: 'idle',
    saveType: options.saveType,
    sessionId: sessionId ?? undefined,
    formData,
  });
}

export function closeSaveDialog() {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);
  store.set(SaveDialogAtom, { ...current, isOpen: false });
}

export function updateSaveDialogFormField(field: keyof { title: string; description: string }, value: string) {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);

  // For sessions, prevent title updates since it's auto-generated from story metadata
  if (current.saveType === 'session' && field === 'title') {
    return;
  }

  store.set(SaveDialogAtom, {
    ...current,
    formData: { ...current.formData, [field]: value },
  });
}

export function setSaveDialogType(saveType: SaveType) {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);
  store.set(SaveDialogAtom, { ...current, saveType });
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

export async function performSave() {
  const store = getDefaultStore();
  const saveDialog = store.get(SaveDialogAtom);
  const story = store.get(StoryAtom);

  // For sessions, always use the story's title
  if (saveDialog.saveType === 'session') {
    const updatedFormData = {
      ...saveDialog.formData,
      title: story.metadata.title || 'Untitled Session',
    };
    store.set(SaveDialogAtom, { ...saveDialog, formData: updatedFormData });
  }

  // Validate form (only for stories since session titles are auto-generated)
  if (saveDialog.saveType === 'story' && !saveDialog.formData.title.trim()) {
    toast.error('Title is required');
    return false;
  }

  // Set saving state
  store.set(SaveDialogAtom, { ...saveDialog, status: 'saving' });

  try {
    let data: Uint8Array | string;
    let endpoint: string;

    if (saveDialog.saveType === 'session') {
      data = await prepareSessionData(story);
      endpoint = 'session';
    } else {
      data = await prepareStateData(story);
      endpoint = 'story';
    }

    const result = await saveToAPI(data, endpoint, saveDialog.formData, saveDialog.sessionId);

    const isUpdate = !!saveDialog.sessionId;
    const actionText = isUpdate ? 'updated' : 'saved';

    toast.success(`${saveDialog.saveType === 'session' ? 'Session' : 'Story'} ${actionText} successfully!`, {
      description: `${isUpdate ? 'Updated' : 'Saved as'} "${saveDialog.formData.title}"`,
      action: {
        label: 'View My Stories →',
        onClick: () => (window.location.href = '/my-stories'),
      },
    });

    console.log('Save result:', result);

    closeSaveDialog();

    // If this was a story save, show the share modal
    if (saveDialog.saveType === 'story' && result.id) {
      store.set(PublishedStoryModalAtom, {
        isOpen: true,
        status: 'success',
        data: {
          itemId: result.id,
          itemTitle: saveDialog.formData.title,
          itemType: 'story',
        },
      });
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
