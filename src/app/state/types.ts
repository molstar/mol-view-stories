import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

// Unified Async Status Types - replaces granular loading/error patterns
export type AsyncStatus<T = void, E = string> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// UI Interaction Status - replaces multiple boolean flags
export type UIStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

// Modal/Dialog State - unified pattern for all modal interactions
export interface ModalState<T = unknown> {
  isOpen: boolean;
  status: UIStatus;
  data?: T;
  error?: string;
}

// Confirmation Dialog State - replaces scattered confirmation states
export interface ConfirmationState {
  isOpen: boolean;
  type: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  data?: unknown;
}

export type StoryContainer = {
  version: 1;
  story: Story;
};

export type StoryMetadata = {
  title: string;
};

export type Story = {
  metadata: StoryMetadata;
  javascript: string;
  scenes: SceneData[];
  assets: SceneAsset[];
};

// a file
export type SceneAsset = {
  name: string;
  content: Uint8Array;
};

export type CameraData = {
  mode: 'perspective' | 'orthographic';
  target: [number, number, number] | Vec3;
  position: [number, number, number] | Vec3;
  up: [number, number, number] | Vec3;
  fov: number;
};

export type SceneData = {
  id: string;
  header: string;
  key: string;
  description: string;
  javascript: string;
  camera?: CameraData | null;
  linger_duration_ms?: number;
  transition_duration_ms?: number;
};

export type SceneUpdate = Partial<Omit<SceneData, 'id'>>;

export type CreateSceneData = Omit<SceneData, 'id'>;

export type CurrentView =
  | { type: 'story-options'; subview: 'story-metadata' | 'story-wide-code' | 'asset-upload' }
  | { type: 'scene'; id: string; subview: 'scene-options' | '3d-view' }
  | { type: 'preview'; previous?: CurrentView };

export interface Creator {
  email: string;
  id: string;
  name: string;
}

export interface BaseItem {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  version: string;
  creator: Creator;
}

export interface SessionItem extends BaseItem {
  type: 'session';
}

export interface StoryItem extends BaseItem {
  type: 'story';
  // TODO: format?: 'mvsj' | 'mvsx';
}

export interface ApiResponse<T> {
  data: T[];
  error?: string;
}

export interface UserQuota {
  overall: {
    any_limit_reached: boolean;
    any_near_limit: boolean;
    total_limit: number;
    total_objects: number;
  };
  sessions: {
    current: number;
    limit: number;
    limit_reached: boolean;
    near_limit: boolean;
    remaining: number;
    usage_percent: number;
  };
  stories: {
    current: number;
    limit: number;
    limit_reached: boolean;
    near_limit: boolean;
    remaining: number;
    usage_percent: number;
  };
  user_id: string;
  user_name: string;
}
