import { useState } from 'react';
import { Button } from '../../ui/button';
import { Session, State, Visibility } from '@/app/state/types';
import { SimpleStory } from '@/app/examples/default';
import { getMVSData } from '@/app/state/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface StateFormData {
  filename: string;
  visibility: Visibility;
  title: string;
  description: string;
}

interface CRUDOperationsProps {
  token: string;
  userId: string;
  publicOnly?: boolean;
}

export function CRUDOperations({ token, userId, publicOnly = false }: CRUDOperationsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStateDialog, setShowStateDialog] = useState(false);
  const [stateForm, setStateForm] = useState<StateFormData>({
    filename: '1cbs-retinoic-acid.mvsj',
    visibility: 'private',
    title: '1CBS Retinoic Acid Complex',
    description: 'Visualization of retinoic acid binding protein with ligand'
  });

  const resetStateForm = () => {
    setStateForm({
      filename: '1cbs-retinoic-acid.mvsj',
      visibility: 'private',
      title: '1CBS Retinoic Acid Complex',
      description: 'Visualization of retinoic acid binding protein with ligand'
    });
  };

  const handleStateFormChange = (field: keyof StateFormData, value: string) => {
    setStateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStateForm = (): string | null => {
    if (!stateForm.filename) return 'Filename is required';
    if (!stateForm.filename.endsWith('.mvsj')) return 'Filename must end with .mvsj';
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
      // If the error text isn't JSON, use it directly
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
    try {
      const stateContent = await getMVSData(SimpleStory);
      
      const statePayload = {
        type: 'state',
        filename: stateForm.filename,
        visibility: stateForm.visibility,
        title: stateForm.title,
        description: stateForm.description,
        data: stateContent
      };
      console.log('Creating state with payload:', JSON.stringify(statePayload, null, 2));

      const stateResponse = await fetch('https://mol-view-stories.dyn.cloud.e-infra.cz/api/states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(statePayload)
      });

      console.log('State creation response status:', stateResponse.status);
      if (!stateResponse.ok) {
        await handleApiError(stateResponse, 'Failed to create state');
      }

      const stateData = await stateResponse.json();
      console.log('Created state:', JSON.stringify(stateData, null, 2));

      // Create session linking to the state
      const sessionPayload = {
        type: 'session',
        visibility: stateForm.visibility,
        title: stateForm.title,
        description: stateForm.description,
        metadata: {
          pdbId: '1cbs',
          ligand: 'Retinoic Acid',
          created: new Date().toISOString()
        },
        states: [stateData.id]
      };
      console.log('Creating session with payload:', JSON.stringify(sessionPayload, null, 2));

      const sessionResponse = await fetch('https://mol-view-stories.dyn.cloud.e-infra.cz/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionPayload)
      });

      console.log('Session creation response status:', sessionResponse.status);
      if (!sessionResponse.ok) {
        await handleApiError(sessionResponse, 'Failed to create session');
      }

      const sessionData = await sessionResponse.json();
      console.log('Created session:', JSON.stringify(sessionData, null, 2));

      // Reset form and close dialog
      resetStateForm();
      setShowStateDialog(false);

      // Refresh the lists
      fetchData('sessions');
      fetchData('states');
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
    try {
      const url = new URL(`https://mol-view-stories.dyn.cloud.e-infra.cz/api/${endpoint}`);
      if (visibility) {
        url.searchParams.append('visibility', visibility);
        if (visibility === 'private') {
          url.searchParams.append('user_id', userId);
        }
      }

      console.log(`Fetching ${endpoint}:`, url.toString());
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`${endpoint} fetch response status:`, response.status);
      if (!response.ok) {
        await handleApiError(response, `Failed to fetch ${endpoint}`);
      }

      const data = await response.json();
      console.log(`${endpoint} fetch response data:`, JSON.stringify(data, null, 2));
      
      if (endpoint === 'sessions') {
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

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {publicOnly ? (
          <Button onClick={() => {
            fetchData('sessions', 'public');
            fetchData('states', 'public');
          }}>List Public Stories</Button>
        ) : (
          <>
            <Button onClick={() => setShowStateDialog(true)}>Create Simple State</Button>
            <Button onClick={() => {
              fetchData('sessions');
              fetchData('states');
            }}>Read All</Button>
            <Button onClick={() => {
              fetchData('sessions', 'public');
              fetchData('states', 'public');
            }}>Read Public</Button>
            <Button onClick={() => {
              fetchData('sessions', 'private');
              fetchData('states', 'private');
            }}>Read Private</Button>
            <Button>Update</Button>
            <Button>Delete</Button>
          </>
        )}
      </div>

      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New State</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                Filename
              </Label>
              <Input
                id="filename"
                value={stateForm.filename}
                onChange={(e) => handleStateFormChange('filename', e.target.value)}
                className="col-span-3"
                placeholder="example-state.mvsj"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                Visibility
              </Label>
              <Select
                value={stateForm.visibility}
                onValueChange={(value) => handleStateFormChange('visibility', value as Visibility)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={stateForm.title}
                onChange={(e) => handleStateFormChange('title', e.target.value)}
                className="col-span-3"
                placeholder="My Molecular State"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={stateForm.description}
                onChange={(e) => handleStateFormChange('description', e.target.value)}
                className="col-span-3"
                placeholder="Description of the molecular state"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createExampleState} disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && <div>Loading...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Sessions</h3>
            <div className="grid grid-cols-1 gap-2">
              {sessions.map(session => (
                <div key={session.id} className="border p-4 rounded">
                  <div className="font-medium">{session.title}</div>
                  <div className="text-sm text-gray-500">
                    ID: {session.id} | Visibility: {session.visibility}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">States</h3>
            <div className="grid grid-cols-1 gap-2">
              {states.map(state => (
                <div key={state.id} className="border p-4 rounded">
                  <div className="font-medium">{state.title}</div>
                  <div className="text-sm text-gray-500">
                    ID: {state.id} | Visibility: {state.visibility}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 