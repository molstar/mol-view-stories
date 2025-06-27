import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Session, State, Visibility } from '@/app/state/types';
import { useCRUDOperations, CRUDOperationsProps, StateFormData } from './useCRUDOperations';

interface StateFormProps {
  stateForm: StateFormData;
  loading: boolean;
  onSubmit: () => void;
  onChange: (field: keyof StateFormData, value: string) => void;
  onCancel: () => void;
}

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

interface DataListProps {
  title: string;
  items: (Session | State)[];
}

const DataList: React.FC<DataListProps> = ({ title, items }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="grid grid-cols-1 gap-2">
      {items.map(item => (
        <div key={item.id} className="border p-4 rounded">
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
    showStateDialog,
    showSessionDialog,
    stateForm,
    setShowStateDialog,
    setShowSessionDialog,
    handleStateFormChange,
    createExampleState,
    createExampleSession,
    fetchData,
  } = useCRUDOperations(props);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {props.publicOnly ? (
          <Button onClick={() => {
            fetchData('session', 'public');
            fetchData('state', 'public');
          }}>List Public Stories</Button>
        ) : (
          <>
            <Button onClick={() => setShowStateDialog(true)}>Create Simple State</Button>
            <Button onClick={() => setShowSessionDialog(true)}>Create Simple Session</Button>
            <Button onClick={() => fetchData('state')}>Read My States</Button>
            <Button onClick={() => fetchData('session')}>Read My Sessions</Button>
            <Button onClick={() => fetchData('state', 'public')}>Read Public States</Button>
            <Button onClick={() => fetchData('session', 'public')}>Read Public Sessions</Button>
            <Button onClick={() => {
              fetchData('session', 'private');
              fetchData('state', 'private');
            }}>Read Private</Button>
            <Button>Update</Button>
            <Button>Delete</Button>
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

      {loading && <div>Loading...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          <DataList title="Sessions" items={sessions} />
          <DataList title="States" items={states} />
        </div>
      )}
    </div>
  );
}