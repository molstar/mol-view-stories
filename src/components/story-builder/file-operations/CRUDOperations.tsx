import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Session, State, Visibility } from '@/app/state/types';
import { useCRUDOperations, CRUDOperationsProps, StateFormData } from './useCRUDOperations';
import { useState } from 'react';

interface StateFormProps {
  stateForm: StateFormData;
  loading: boolean;
  onSubmit: () => void;
  onChange: (field: keyof StateFormData, value: string) => void;
  onCancel: () => void;
}

const SuccessNotification: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Success: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);

const StateFormDialog: React.FC<StateFormProps> = ({
  stateForm,
  loading,
  onSubmit,
  onChange,
  onCancel,
}) => (
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
          onChange={(e) => onChange('filename', e.target.value)}
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
          onValueChange={(value) => onChange('visibility', value as Visibility)}
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
          onChange={(e) => onChange('title', e.target.value)}
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
          onChange={(e) => onChange('description', e.target.value)}
          className="col-span-3"
          placeholder="Description of the molecular state"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </Button>
    </DialogFooter>
  </DialogContent>
);

const SessionFormDialog: React.FC<StateFormProps> = ({
  stateForm,
  loading,
  onSubmit,
  onChange,
  onCancel,
}) => (
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Session</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="filename" className="text-right">
          Filename
        </Label>
        <Input
          id="filename"
          value={stateForm.filename}
          onChange={(e) => onChange('filename', e.target.value)}
          className="col-span-3"
          placeholder="example-session.js"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="visibility" className="text-right">
          Visibility
        </Label>
        <Select
          value={stateForm.visibility}
          onValueChange={(value) => onChange('visibility', value as Visibility)}
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
          onChange={(e) => onChange('title', e.target.value)}
          className="col-span-3"
          placeholder="My Session"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Input
          id="description"
          value={stateForm.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="col-span-3"
          placeholder="Description of the session"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </Button>
    </DialogFooter>
  </DialogContent>
);

interface MetadataDialogProps {
  item: Session | State | null;
  onClose: () => void;
}

const MetadataDialog: React.FC<MetadataDialogProps> = ({ item, onClose }) => {
  if (!item) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getPublicStateUrl = (stateId: string) => {
    return `https://mol-view-stories.dyn.cloud.e-infra.cz/api/public/state/${stateId}`;
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{item.title} Details</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">ID</Label>
          <div className="col-span-3">{item.id}</div>
        </div>
        {item.type === 'state' && item.visibility === 'public' && (
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-semibold">Public Link</Label>
            <div className="col-span-3">
              <a 
                href={getPublicStateUrl(item.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {getPublicStateUrl(item.id)}
              </a>
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Type</Label>
          <div className="col-span-3">{item.type}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Title</Label>
          <div className="col-span-3">{item.title}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Description</Label>
          <div className="col-span-3">{item.description}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Visibility</Label>
          <div className="col-span-3">{item.visibility}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Created</Label>
          <div className="col-span-3">{formatDate(item.created_at)}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Updated</Label>
          <div className="col-span-3">{formatDate(item.updated_at)}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Version</Label>
          <div className="col-span-3">{item.version}</div>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right font-semibold">Creator</Label>
          <div className="col-span-3">
            <div>{item.creator.name}</div>
            <div className="text-sm text-gray-500">{item.creator.email}</div>
            <div className="text-sm text-gray-500">ID: {item.creator.id}</div>
          </div>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-semibold">Tags</Label>
            <div className="col-span-3">
              {item.tags.join(', ')}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
};

interface DataListProps {
  title: string;
  items: (Session | State)[];
  onItemClick: (item: Session | State) => void;
}

const DataList: React.FC<DataListProps> = ({ title, items, onItemClick }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="grid grid-cols-1 gap-2">
      {items.map(item => (
        <div 
          key={item.id} 
          className="border p-4 rounded hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onItemClick(item)}
        >
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-gray-500">
            ID: {item.id} | Visibility: {item.visibility}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export function CRUDOperations(props: CRUDOperationsProps) {
  const {
    sessions,
    states,
    loading,
    error,
    success,
    showStateDialog,
    showSessionDialog,
    stateForm,
    activeView,
    setShowStateDialog,
    setShowSessionDialog,
    handleStateFormChange,
    createExampleState,
    createExampleSession,
    fetchData,
  } = useCRUDOperations(props);

  const [selectedItem, setSelectedItem] = useState<Session | State | null>(null);

  const handleItemClick = (item: Session | State) => {
    setSelectedItem(item);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {props.publicOnly ? (
          <>
            <Button onClick={() => fetchData('state', 'public')}>List Public States</Button>
            <Button onClick={() => fetchData('session', 'public')}>List Public Sessions</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setShowStateDialog(true)}>Create Simple State</Button>
            <Button onClick={() => setShowSessionDialog(true)}>Create Simple Session</Button>
            <Button onClick={() => fetchData('state')}>Read My States</Button>
            <Button onClick={() => fetchData('session')}>Read My Sessions</Button>
            <Button onClick={() => fetchData('state', 'public')}>Read Public States</Button>
            <Button onClick={() => fetchData('session', 'public')}>Read Public Sessions</Button>
            <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">Update (Not Available)</Button>
            <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">Delete (Not Available)</Button>
          </>
        )}
      </div>

      <Dialog open={showStateDialog} onOpenChange={setShowStateDialog}>
        <StateFormDialog
          stateForm={stateForm}
          loading={loading}
          onSubmit={createExampleState}
          onChange={handleStateFormChange}
          onCancel={() => setShowStateDialog(false)}
        />
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <SessionFormDialog
          stateForm={stateForm}
          loading={loading}
          onSubmit={createExampleSession}
          onChange={handleStateFormChange}
          onCancel={() => setShowSessionDialog(false)}
        />
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <MetadataDialog 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      </Dialog>

      {loading && <div>Loading...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && <SuccessNotification message={success} />}

      {!loading && !error && activeView === 'session' && (
        <DataList 
          title="Sessions" 
          items={sessions} 
          onItemClick={handleItemClick}
        />
      )}
      {!loading && !error && activeView === 'state' && (
        <DataList 
          title="States" 
          items={states} 
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}