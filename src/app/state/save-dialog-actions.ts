import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, type SaveFormData, type SaveType } from './atoms';
import { type Story, type StoryContainer } from './types';
import { authenticatedFetch, API_CONFIG } from '@/lib/auth-utils';
import { getMVSData, resetInitialStoryState } from './actions';

// SaveDialog Actions
export function openSaveDialog(options: { saveType: SaveType; sessionId?: string }) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);

  const formData: SaveFormData = {
    title: story.metadata.title || '',
    description: '',
    visibility: options.saveType === 'session' ? 'private' : 'public',
    tags: '',
  };

  store.set(SaveDialogAtom, {
    isOpen: true,
    saveType: options.saveType,
    sessionId: options.sessionId,
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

async function saveToAPI(data: Uint8Array | string, endpoint: string, formData: SaveFormData) {
  // Determine correct file extension based on endpoint
  const getFileExtension = (endpoint: string, data: Uint8Array | string) => {
    if (endpoint === 'session') {
      return '.msgpack';
    } else {
      // For states, use .mvsj for JSON data, .mvsx for binary data
      return data instanceof Uint8Array ? '.mvsx' : '.mvsj';
    }
  };

  const processedTags = formData.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const requestBody = {
    title: formData.title.trim(),
    filename: formData.title.trim() + getFileExtension(endpoint, data),
    description: formData.description.trim(),
    visibility: formData.visibility,
    tags: processedTags,
    // Handle data based on type
    data:
      data instanceof Uint8Array
        ? btoa(String.fromCharCode(...data)) // Convert Uint8Array to base64 string
        : typeof data === 'string'
          ? JSON.parse(data)
          : data, // Parse JSON string to object for states
  };

  const url = `${API_CONFIG.baseUrl}/api/${endpoint}`;
  const method = 'POST';

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

    const result = await saveToAPI(data, endpoint, saveDialog.formData);

    toast.success(`${saveDialog.saveType === 'session' ? 'Session' : 'State'} saved successfully!`, {
      description: `Saved as "${saveDialog.formData.title}"`,
    });

    console.log('Save result:', result);
    
    // Reset initial state to mark as saved
    resetInitialStoryState();
    
    closeSaveDialog();

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
