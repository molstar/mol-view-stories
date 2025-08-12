import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, PublishedStoryModalAtom, SessionMetadataAtom } from './atoms';
import { type Story, type StoryContainer, type SessionMetadata } from './types';
import { authenticatedFetch } from '@/lib/auth/token-manager';
import { API_CONFIG } from '@/lib/config';
import { encodeUint8ArrayToBase64 } from '@/lib/data-utils';
import { getMVSData, setIsDirty, setSessionIdUrl, SessionFileExtension } from './actions';

// File size validation utility
// Note that file size is also checked at the API, this is a safety check to avoid expensive sending of oversized data.
const MAX_FILE_SIZE_MB = 50; // Keep in sync with backend limit

function validateDataSize(data: Uint8Array | string, maxSizeMB: number = MAX_FILE_SIZE_MB): void {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let sizeBytes: number;

  if (data instanceof Uint8Array) {
    sizeBytes = data.byteLength;
  } else {
    // For string data (JSON), calculate the byte size
    sizeBytes = new Blob([data]).size;
  }

  if (sizeBytes > maxSizeBytes) {
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(1);
    throw new Error(
      `SAVE FAILED: Session too large (${sizeMB}MB, max: ${maxSizeMB}MB). Please reduce complexity or remove large assets to continue.`
    );
  }
}

// SaveDialog Actions
export function openSaveDialog() {
  const sessionId = new URL(window.location.href).searchParams.get('sessionId') ?? undefined;
  const store = getDefaultStore();

  // Get existing session metadata if available
  const sessionMetadata = store.get(SessionMetadataAtom);
  const existingDescription = sessionMetadata?.description || '';

  store.set(SaveDialogAtom, {
    isOpen: true,
    status: 'idle',
    data: {
      sessionId,
      note: existingDescription,
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

    const errorMessage = error instanceof Error ? error.message : 'PUBLISH FAILED: Unknown error occurred';
    const isFileSizeError =
      errorMessage.includes('too large') || errorMessage.includes('FAILED') || errorMessage.includes('maximum allowed');

    // Add explicit failure prefix if not already present
    const displayMessage = errorMessage.includes('FAILED') ? errorMessage : `PUBLISH FAILED: ${errorMessage}`;

    toast.error(displayMessage, {
      duration: isFileSizeError ? 10000 : 5000, // 10 seconds for file size errors, 5 seconds for others
      closeButton: true, // Allow manual dismissal
      style: isFileSizeError
        ? {
            backgroundColor: '#fee2e2', // Light red background for file size errors
            borderColor: '#dc2626', // Red border
            color: '#991b1b', // Dark red text
          }
        : undefined,
    });

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

  // Validate file size before proceeding
  validateDataSize(deflated);

  return deflated;
}

async function prepareStateData(story: Story): Promise<Uint8Array | string> {
  const mvsData = await getMVSData(story);

  let finalData: Uint8Array | string;
  if (mvsData instanceof Uint8Array) {
    finalData = mvsData;
  } else {
    // Convert to JSON string for API
    finalData = JSON.stringify(mvsData);
  }

  // Validate file size before proceeding
  validateDataSize(finalData);

  return finalData;
}

async function saveToAPI(
  data: Uint8Array | string,
  endpoint: string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  // For sessions, use new FormData approach; for stories, keep JSON approach
  if (endpoint === 'session') {
    return await saveSessionWithFormData(data, formData, sessionId);
  } else {
    return await saveStoryWithJSON(data, endpoint, formData, sessionId);
  }
}

async function saveSessionWithFormData(
  data: Uint8Array | string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  // Validate data before proceeding
  if (data instanceof Uint8Array) {
    validateDataSize(data);
  } else if (typeof data === 'string') {
    validateDataSize(data);
  } else {
    validateDataSize(JSON.stringify(data));
  }

  // Create FormData for session
  const formDataToSend = new FormData();
  formDataToSend.append('title', formData.title.trim());
  formDataToSend.append('description', formData.description.trim());
  formDataToSend.append('tags', JSON.stringify([])); // Default empty tags
  
  // Only include filename for new sessions (POST), not updates (PUT)
  if (!sessionId) {
    const filename = formData.title.trim() + SessionFileExtension;
    formDataToSend.append('filename', filename);
  }

  // Add the file data as blob
  if (data instanceof Uint8Array) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    formDataToSend.append('file', blob, 'session.mvstory');
  } else {
    // Convert string data to Uint8Array if needed
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    formDataToSend.append('file', blob, 'session.mvstory');
  }

  // If sessionId is provided, update existing session; otherwise create new
  const url = sessionId
    ? `${API_CONFIG.baseUrl}/api/session/${sessionId}`
    : `${API_CONFIG.baseUrl}/api/session`;
  const method = sessionId ? 'PUT' : 'POST';

  const response = await authenticatedFetch(url, {
    method,
    body: formDataToSend,
  });

  if (!response.ok) {
    // Handle specific HTTP status codes with user-friendly messages
    if (response.status === 413) {
      throw new Error(
        `SAVE FAILED: Session too large (over ${MAX_FILE_SIZE_MB}MB limit). Please reduce complexity or remove large assets to continue.`
      );
    }

    const errorText = await response.text();

    // Try to parse structured error from backend
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        throw new Error(`Save failed: ${errorData.message}`);
      }
    } catch {
      // Fall back to generic error if parsing fails
    }

    throw new Error(`Failed to save: ${response.statusText}`);
  }

  return await response.json();
}

async function saveStoryWithJSON(
  data: Uint8Array | string,
  endpoint: string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  // Determine correct file extension based on endpoint
  const getFileExtension = (endpoint: string, data: Uint8Array | string) => {
    if (endpoint === 'session') {
      return SessionFileExtension;
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
    data: undefined,
  };

  // Handle data based on type - async for Uint8Array
  if (data instanceof Uint8Array) {
    requestBody.data = await encodeUint8ArrayToBase64(data);
    // Validate Uint8Array data
    validateDataSize(data);
  } else if (typeof data === 'string') {
    requestBody.data = JSON.parse(data);
    // Validate string data
    validateDataSize(data);
  } else {
    requestBody.data = data;
    // For other types, validate the stringified version
    validateDataSize(JSON.stringify(data));
  }

  // Only include filename for new sessions (POST), not updates (PUT)
  if (!sessionId) {
    requestBody.filename = formData.title.trim() + getFileExtension(endpoint, data);
  }

  try {
    // Validation already performed above based on data type
  } catch (error) {
    const operation = endpoint === 'session' ? 'SAVE' : 'PUBLISH';
    throw new Error(
      error instanceof Error
        ? error.message.replace('SAVE FAILED', `${operation} FAILED`)
        : `${operation} FAILED: Request data too large`
    );
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
    // Handle specific HTTP status codes with user-friendly messages
    if (response.status === 413) {
      const operation = endpoint === 'session' ? 'SAVE' : 'PUBLISH';
      throw new Error(
        `${operation} FAILED: Session too large (over ${MAX_FILE_SIZE_MB}MB limit). Please reduce complexity or remove large assets to continue.`
      );
    }

    const errorText = await response.text();

    // Try to parse structured error from backend
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        const operation = endpoint === 'session' ? 'Save' : 'Publish';
        throw new Error(`${operation} failed: ${errorData.message}`);
      }
    } catch {
      // Fall back to generic error if parsing fails
    }

    const operation = endpoint === 'session' ? 'save' : 'publish';
    throw new Error(`Failed to ${operation}: ${response.statusText}`);
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

  try {
    // Set saving state after size check passes
    store.set(SaveDialogAtom, { ...saveDialog, status: 'processing' });

    const data = await prepareSessionData(story);
    const result = (await saveToAPI(data, 'session', formData, sessionId)) as SessionMetadata;

    const isUpdate = !!sessionId;
    const actionText = isUpdate ? 'updated' : 'saved';

    toast.success(`Session ${actionText} successfully!`, {
      description: `${isUpdate ? 'Updated' : 'Saved as'} "${formData.title}"`,
      action: {
        label: 'View My Stories →',
        onClick: () => (window.location.href = `/${process.env.NEXT_PUBLIC_APP_PREFIX || ''}my-stories`),
      },
    });

    setIsDirty(false);
    closeSaveDialog();

    if (result.id) {
      setSessionIdUrl(result.id);
    }

    // Update SessionMetadataAtom with the new metadata to preserve the note for future saves
    if (result.description !== undefined) {
      const currentMetadata = store.get(SessionMetadataAtom);
      if (currentMetadata) {
        store.set(SessionMetadataAtom, {
          ...currentMetadata,
          description: result.description,
          title: result.title || currentMetadata.title,
          updated_at: result.updated_at || currentMetadata.updated_at,
        });
      } else {
        // If no existing metadata, create new metadata from the result
        store.set(SessionMetadataAtom, {
          id: result.id,
          type: 'session',
          created_at: result.created_at,
          updated_at: result.updated_at,
          creator: result.creator,
          title: result.title,
          description: result.description,
          tags: result.tags || [],
          version: result.version,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Save failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'SAVE FAILED: Unknown error occurred';
    const isFileSizeError =
      errorMessage.includes('too large') || errorMessage.includes('FAILED') || errorMessage.includes('maximum allowed');

    // Add explicit failure prefix if not already present
    const displayMessage = errorMessage.includes('FAILED') ? errorMessage : `SAVE FAILED: ${errorMessage}`;

    toast.error(displayMessage, {
      duration: isFileSizeError ? 10000 : 5000, // 10 seconds for file size errors, 5 seconds for others
      closeButton: true, // Allow manual dismissal
      style: isFileSizeError
        ? {
            backgroundColor: '#fee2e2', // Light red background for file size errors
            borderColor: '#dc2626', // Red border
            color: '#991b1b', // Dark red text
          }
        : undefined,
    });

    return false;
  } finally {
    // Reset saving state
    const current = store.get(SaveDialogAtom);
    store.set(SaveDialogAtom, { ...current, status: 'idle' });
  }
}
