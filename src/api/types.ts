// Project types
export interface ProjectResponse {
  id: string;
  name: string;
  current_revision_id?: string;
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  graph_state?: GraphStateDTO;
}

export interface CreateProjectResponse {
  project: ProjectResponse;
  revision: RevisionSummary;
}

// Revision types
export interface RevisionSummary {
  id: string;
  version_number: number;
  created_at: string;
}

export interface RevisionDetailResponse {
  id: string;
  project_id: string;
  version_number: number;
  graph_state: GraphStateDTO;
  created_at: string;
}

// Graph state types
export interface GraphStateDTO {
  nodes: NodeStateDTO[];
}

export interface NodeStateDTO {
  id: string;
  plugin_id: string;
  image: string;
  inputs: Record<string, string>;
}

export interface CreateRevisionRequest {
  graph_state: GraphStateDTO;
}

// Plugin types
export interface PluginSummary {
  id: string;
  name: string;
  version: string;
  category: 'worker' | 'stateful';
}

export interface PluginDetailResponse {
  id: string;
  name: string;
  version: string;
  category: 'worker' | 'stateful';
  inputs: InputDTO[];
  exports: ExportDTO[];
}

export interface InputDTO {
  id: string;
  type: 'port' | 'secret' | 'plugin';
  inject_as?: string;
  default?: string;
  generate?: boolean;
  accepts?: string; // For plugin type: which plugin ID is accepted
}

export interface ExportDTO {
  key: string;
  value: string; // Template like "{{HOST}}:{{PORT}}"
}

// Crypto types
export interface EncryptRequest {
  value: string;
}

export interface EncryptResponse {
  cipher: string; // "SECRET:..."
}

export interface GenerateResponse {
  value: string;
  cipher: string;
}

// Deploy types
export interface DeployResponse {
  status: string;
  message: string;
}

export interface StopResponse {
  status: string;
  message?: string;
}

// WebSocket event types
export type EventType =
  | 'deploy_started'
  | 'node_starting'
  | 'node_health_check'
  | 'node_ready'
  | 'node_failed'
  | 'deploy_completed'
  | 'deploy_failed';

export interface DeploymentEvent {
  type: EventType;
  timestamp: string;
  project_id: string;
  data?: NodeProgressData | DeployResultData;
}

export interface NodeProgressData {
  node_id: string;
  plugin_id?: string;
  phase: string;
  message?: string;
}

export interface DeployResultData {
  success: boolean;
  container_ids?: Record<string, string>;
  error?: string;
}

// API error type
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
