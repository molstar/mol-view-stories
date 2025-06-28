import { useState } from 'react';
import { Session, State, Visibility } from '@/app/state/types';
import { SimpleStory } from '@/app/examples/default';
import { getMVSData } from '@/app/state/actions';

export interface StateFormData {
  filename: string;
  visibility: Visibility;
  title: string;
  description: string;
}

export interface CRUDOperationsProps {
  token: string;
  userId: string;
  publicOnly?: boolean;
}

export const DEFAULT_STATE_FORM: StateFormData = {
  filename: '1cbs-retinoic-acid.mvsj',
  visibility: 'private',
  title: '1CBS Retinoic Acid Complex',
  description: 'Visualization of retinoic acid binding protein with ligand',
};

export const DEFAULT_SESSION_FORM: StateFormData = {
  filename: 'default-story.js',
  visibility: 'private',
  title: 'Default Story',
  description: 'Default molecular visualization story',
};

export const useCRUDOperations = ({ token, userId, publicOnly = false }: CRUDOperationsProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [stateForm, setStateForm] = useState<StateFormData>(DEFAULT_STATE_FORM);
  const [activeView, setActiveView] = useState<'session' | 'state' | null>(null);

  const handleShowStateDialog = (show: boolean) => {
    setShowStateDialog(show);
    if (show) {
      setStateForm(DEFAULT_STATE_FORM);
      setSuccess(null);
      setError(null);
    }
  };

  const handleShowSessionDialog = (show: boolean) => {
    setShowSessionDialog(show);
    if (show) {
      setStateForm(DEFAULT_SESSION_FORM);
      setSuccess(null);
      setError(null);
    }
  };

  const resetStateForm = (isSession: boolean = false) => {
    setStateForm(isSession ? DEFAULT_SESSION_FORM : DEFAULT_STATE_FORM);
  };

  const handleStateFormChange = (field: keyof StateFormData, value: string) => {
    setStateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStateForm = (isSession: boolean = false): string | null => {
    if (!stateForm.filename) return 'Filename is required';
    if (isSession) {
      if (!stateForm.filename.endsWith('.js')) return 'Filename must end with .js';
    } else {
      if (!stateForm.filename.endsWith('.mvsj')) return 'Filename must end with .mvsj';
    }
    if (!stateForm.title) return 'Title is required';
    return null;
  };

  const handleApiError = async (response: Response, context: string) => {
    const errorText = await response.text();
    let errorMessage = `${context}: ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = `${context}: ${errorJson.message}`;
      }
    } catch (e) {
      if (errorText) {
        errorMessage = `${context}: ${errorText}`;
      }
    }

    throw new Error(errorMessage);
  };

  const createExampleState = async () => {
    const validationError = validateStateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const stateContent = await getMVSData(SimpleStory);

      const statePayload = {
        type: 'state',
        filename: stateForm.filename,
        visibility: stateForm.visibility,
        title: stateForm.title,
        description: stateForm.description,
        data: stateContent,
      };

      const stateResponse = await fetch('https://mol-view-stories.dyn.cloud.e-infra.cz/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statePayload),
      });

      if (!stateResponse.ok) {
        await handleApiError(stateResponse, 'Failed to create state');
      }

      const data = await stateResponse.json();
      setSuccess(`Successfully created state "${stateForm.title}" with ID: ${data.id}`);
      resetStateForm();
      setShowStateDialog(false);
      fetchData('state');
    } catch (err) {
      console.error('Error during creation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createExampleSession = async () => {
    const validationError = validateStateForm(true);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const sessionPayload = {
        type: 'session',
        filename: stateForm.filename,
        visibility: stateForm.visibility,
        title: stateForm.title,
        description: stateForm.description,
        metadata: {
          pdbId: '1cbs',
          ligand: 'Retinoic Acid',
          created: new Date().toISOString(),
        },
        states: [],
        data: SimpleStory,
      };

      const sessionResponse = await fetch('https://mol-view-stories.dyn.cloud.e-infra.cz/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionPayload),
      });

      if (!sessionResponse.ok) {
        await handleApiError(sessionResponse, 'Failed to create session');
      }

      const data = await sessionResponse.json();
      setSuccess(`Successfully created session "${stateForm.title}" with ID: ${data.id}`);
      resetStateForm(true);
      setShowSessionDialog(false);
      fetchData('session');
    } catch (err) {
      console.error('Error during creation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (endpoint: string, visibility?: Visibility) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setActiveView(endpoint as 'session' | 'state');
    try {
      const url = new URL(`https://mol-view-stories.dyn.cloud.e-infra.cz/api/${endpoint}`);
      if (visibility) {
        url.searchParams.append('visibility', visibility);
        if (visibility === 'private') {
          url.searchParams.append('user_id', userId);
        }
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await handleApiError(response, `Failed to fetch ${endpoint}`);
      }

      const data = await response.json();

      if (endpoint === 'session') {
        setSessions(data);
      } else {
        setStates(data);
      }
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    states,
    loading,
    error,
    success,
    showStateDialog,
    showSessionDialog,
    stateForm,
    activeView,
    setShowStateDialog: handleShowStateDialog,
    setShowSessionDialog: handleShowSessionDialog,
    handleStateFormChange,
    createExampleState,
    createExampleSession,
    fetchData,
  };
};
