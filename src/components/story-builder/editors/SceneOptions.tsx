import { ActiveSceneAtom, modifyCurrentScene } from '@/app/appstate';
import { StatefulInput } from '@/components/controls';
import { Label } from '@/components/ui/label';
import { useAtomValue } from 'jotai';

export function OptionsEditor() {
  const scene = useAtomValue(ActiveSceneAtom);

  return (
    <div className='flex flex-col gap-2'>
      <div className='space-y-2'>
        <Label htmlFor='scene-header'>Header</Label>
        <StatefulInput
          id='scene-header'
          value={scene?.header || ''}
          placeholder='Scene Title'
          onChange={(value) => {
            modifyCurrentScene({ header: value.trim() });
          }}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='scene-key'>Key</Label>
        <StatefulInput
          id='scene-key'
          value={scene?.key || ''}
          placeholder='Scene Key'
          onChange={(value) => {
            modifyCurrentScene({ key: value.trim() ? value : undefined });
          }}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='linger-duration'>Linger Duration (ms)</Label>
        <StatefulInput
          id='linger-duration'
          value={`${scene?.linger_duration_ms ?? ''}`}
          placeholder='Linger Duration in milliseconds'
          onChange={(value) => {
            if (!value.trim()) {
              modifyCurrentScene({ linger_duration_ms: undefined });
            } else {
              const numValue = parseInt(value, 10);
              modifyCurrentScene({ linger_duration_ms: Number.isFinite(numValue) ? numValue : undefined });
            }
          }}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='transition-duration'>Transition Duration (ms)</Label>
        <StatefulInput
          id='transition-duration'
          value={`${scene?.transition_duration_ms ?? ''}`}
          placeholder='Transition Duration in milliseconds'
          onChange={(value) => {
            if (!value.trim()) {
              modifyCurrentScene({ transition_duration_ms: undefined });
            } else {
              const numValue = parseInt(value, 10);
              modifyCurrentScene({ transition_duration_ms: Number.isFinite(numValue) ? numValue : undefined });
            }
          }}
        />
      </div>
    </div>
  );
}
