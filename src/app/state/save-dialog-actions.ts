import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, CurrentSessionIdAtom, ShareModalAtom, type SaveFormData, type SaveType } from './atoms';
import { type Story, type StoryContainer } from './types';
import { authenticatedFetch } from '@/lib/auth-utils';
import { API_CONFIG } from '@/lib/config';
import { getMVSData, resetInitialStoryState } from './actions';

// Helper function to safely encode large Uint8Array to base64
function encodeUint8ArrayToBase64(data: Uint8Array): Promise<string> {
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

// SaveDialog Actions
export function openSaveDialog(options: { saveType: SaveType; sessionId?: string; saveAsNew?: boolean }) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);
  const currentSessionId = store.get(CurrentSessionIdAtom);

  const formData: SaveFormData = {
    title: story.metadata.title || '',
    description: '',
    visibility: options.saveType === 'session' ? 'private' : 'public',
  };

  // Determine the session ID: use provided sessionId, or current session (unless saveAsNew is true)
  let sessionId = options.sessionId;
  if (!sessionId && !options.saveAsNew && options.saveType === 'session') {
    sessionId = currentSessionId || undefined;
  }

  store.set(SaveDialogAtom, {
    isOpen: true,
    saveType: options.saveType,
    sessionId: sessionId,
    isSaving: false,
    formData,
  });
}

export function closeSaveDialog() {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);
  store.set(SaveDialogAtom, { ...current, isOpen: false });
}

export function updateSaveDialogFormField(field: keyof SaveFormData, value: string) {
  const store = getDefaultStore();
  const current = store.get(SaveDialogAtom);

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

// Direct share story function - saves as public state and shows share modal
export async function shareStory(): Promise<boolean> {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);

  // Prepare form data for state save
  const formData: SaveFormData = {
    title: story.metadata.title || 'Untitled Story',
    description: '',
    visibility: 'public',
  };

  try {
    // Prepare state data
    const data = await prepareStateData(story);
    
    // Save to API
    const result = await saveToAPI(data, 'state', formData);
    
    toast.success('Story shared successfully!', {
      description: `Shared as "${formData.title}"`,
    });

    console.log('Share result:', result);
    
    // Reset initial state to mark as saved
    resetInitialStoryState();

    // Show the share modal
    if (result.id) {
      store.set(ShareModalAtom, {
        isOpen: true,
        itemId: result.id,
        itemTitle: formData.title,
        itemType: 'state',
        publicUri: result.public_uri,
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

async function saveToAPI(data: Uint8Array | string, endpoint: string, formData: SaveFormData, sessionId?: string) {
  // Determine correct file extension based on endpoint
  const getFileExtension = (endpoint: string, data: Uint8Array | string) => {
    if (endpoint === 'session') {
      return '.mvstory';
    } else {
      // For states, use .mvsj for JSON data, .mvsx for binary data
      return data instanceof Uint8Array ? '.mvsx' : '.mvsj';
    }
  };

  const requestBody: any = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    visibility: formData.visibility,
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

  // Validate form
  if (!saveDialog.formData.title.trim()) {
    toast.error('Title is required');
    return false;
  }

  // Set saving state
  store.set(SaveDialogAtom, { ...saveDialog, isSaving: true });

  try {
    let data: Uint8Array | string;
    let endpoint: string;

    if (saveDialog.saveType === 'session') {
      data = await prepareSessionData(story);
      endpoint = 'session';
    } else {
      data = await prepareStateData(story);
      endpoint = 'state';
    }

    const result = await saveToAPI(data, endpoint, saveDialog.formData, saveDialog.sessionId);

    const isUpdate = !!saveDialog.sessionId;
    const actionText = isUpdate ? 'updated' : 'saved';
    
    toast.success(`${saveDialog.saveType === 'session' ? 'Session' : 'State'} ${actionText} successfully!`, {
      description: `${isUpdate ? 'Updated' : 'Saved as'} "${saveDialog.formData.title}"`,
      action: {
        label: 'View My Stories →',
        onClick: () => window.location.href = '/my-stories',
      },
    });

    console.log('Save result:', result);
    
    // If this was a new session save, update the current session ID
    if (saveDialog.saveType === 'session' && !saveDialog.sessionId && result.id) {
      store.set(CurrentSessionIdAtom, result.id);
    }
    
    // Reset initial state to mark as saved
    resetInitialStoryState();
    
    closeSaveDialog();

    // If this was a state save, show the share modal
    if (saveDialog.saveType === 'state' && result.id) {
      store.set(ShareModalAtom, {
        isOpen: true,
        itemId: result.id,
        itemTitle: saveDialog.formData.title,
        itemType: 'state',
        publicUri: result.public_uri,
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
    store.set(SaveDialogAtom, { ...current, isSaving: false });
  }
}
