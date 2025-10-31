import { getDefaultStore } from 'jotai';
import { encodeMsgPack } from 'molstar/lib/mol-io/common/msgpack/encode';
import { Task } from 'molstar/lib/mol-task';
import { deflate } from 'molstar/lib/mol-util/zip/zip';
import { toast } from 'sonner';
import { StoryAtom, SaveDialogAtom, PublishedStoryModalAtom, SessionMetadataAtom } from './atoms';
import type { Story, StoryContainer } from '@mol-view-stories/lib/src/types';
import { type SessionMetadata } from './types';
import { authenticatedFetch } from '@/lib/auth/token-manager';
import { API_CONFIG } from '@/lib/config';
import { getMVSData, setIsDirty, setSessionIdUrl } from './actions';
import { SessionFileExtension } from '@mol-view-stories/lib/src/actions';

// File size validation utility
// Note that file size is also checked at the API, this is a safety check to avoid expensive sending of oversized data.
const MAX_FILE_SIZE_MB = 100; // Keep in sync with backend limit

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
  const sessionId = new URL(window.location.href).searchParams.get('session-id') ?? undefined;
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
export async function publishStory(options?: { storyId?: string }): Promise<{ success: boolean; storyId?: string }> {
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

    return { success: true, storyId: result.id };
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

    return { success: false };
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

  return finalData;
}

async function saveToAPI(
  data: Uint8Array | string,
  endpoint: string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  if (endpoint === 'session') {
    return await saveSession(data, formData, sessionId);
  } else {
    return await saveStory(data, formData, sessionId);
  }
}

async function saveSession(
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
    const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' });
    formDataToSend.append('file', blob, 'session.mvstory');
  } else {
    // Convert string data to Uint8Array if needed
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    formDataToSend.append('file', blob, 'session.mvstory');
  }

  // If sessionId is provided, update existing session; otherwise create new
  const url = sessionId ? `${API_CONFIG.baseUrl}/api/session/${sessionId}` : `${API_CONFIG.baseUrl}/api/session`;
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

async function saveStory(
  data: Uint8Array | string,
  formData: { title: string; description: string },
  sessionId?: string
) {
  const store = getDefaultStore();
  const story = store.get(StoryAtom);

  // Prepare session data first (we need both files to validate total size)
  const sessionData = await prepareSessionData(story);

  // Calculate size of story data
  let storyDataSize: number;
  if (data instanceof Uint8Array) {
    storyDataSize = data.byteLength;
  } else {
    storyDataSize = new Blob([data]).size;
  }

  // Calculate size of session data
  const sessionDataSize = sessionData.byteLength;

  // Calculate TOTAL size of both files being uploaded
  const totalSize = storyDataSize + sessionDataSize;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  // Validate TOTAL size of all files being sent
  if (totalSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `PUBLISH FAILED: Total data payload too large (${totalSizeMB}MB, max: ${MAX_FILE_SIZE_MB}MB). Please reduce complexity or remove large assets.`
    );
  }

  // Create FormData for story + session with new field structure
  const formDataToSend = new FormData();
  formDataToSend.append('title', formData.title.trim());
  formDataToSend.append('description', formData.description.trim());
  formDataToSend.append('tags', JSON.stringify([])); // Default empty tags

  // Determine story file type and add to appropriate field
  if (data instanceof Uint8Array) {
    // Binary data (.mvsx) - use 'mvsx' field
    const storyFilename = formData.title.trim() + '.mvsx';
    const storyBlob = new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
    formDataToSend.append('mvsx', storyBlob, storyFilename);
  } else {
    // JSON data (.mvsj) - use 'mvsj' field
    const storyFilename = formData.title.trim() + '.mvsj';
    const storyData = typeof data === 'string' ? JSON.parse(data) : data;
    const storyBlob = new Blob([JSON.stringify(storyData, null, 2)], { type: 'application/json' });
    formDataToSend.append('mvsj', storyBlob, storyFilename);
  }

  // Add session data to 'session' field
  const sessionBlob = new Blob([sessionData as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' });
  const sessionFilename = formData.title.trim() + '.mvstory';
  formDataToSend.append('session', sessionBlob, sessionFilename);

  // Determine URL and method based on whether we're updating or creating
  const url = sessionId ? `${API_CONFIG.baseUrl}/api/story/${sessionId}` : `${API_CONFIG.baseUrl}/api/story`;
  const method = sessionId ? 'PUT' : 'POST';

  const response = await authenticatedFetch(url, {
    method,
    body: formDataToSend,
  });

  if (!response.ok) {
    // Handle specific HTTP status codes with user-friendly messages
    if (response.status === 413) {
      throw new Error('PUBLISH FAILED: Story data too large. Please reduce the story size and try again.');
    } else if (response.status === 400) {
      const errorResponse = await response.json().catch(() => null);
      const message = errorResponse?.message || 'Invalid story data';
      throw new Error(`PUBLISH FAILED: ${message}`);
    } else if (response.status === 401) {
      throw new Error('PUBLISH FAILED: Authentication required. Please log in and try again.');
    } else if (response.status === 403) {
      throw new Error('PUBLISH FAILED: Permission denied. You may have reached your story limit.');
    } else if (response.status === 500) {
      throw new Error('PUBLISH FAILED: Server error. Please try again later.');
    }

    throw new Error(`Failed to save: ${response.statusText}`);
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
