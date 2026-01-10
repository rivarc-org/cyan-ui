import { create } from 'zustand';
import type { NodeStatus } from '@/types/graph';

type DeploymentStatus = 'idle' | 'deploying' | 'success' | 'failed';

// ViewMode represents the current conceptual state of the editor
export type ViewMode = 'live' | 'draft' | 'history';

interface UIState {
  // Project Context
  activeProjectId: string | null;
  projectName: string | null;
  currentRevisionId: string | null; // The revision that IS live
  activeRevisionId: string | null; // The revision currently loaded in editor
  revisions: import('@/api/types').RevisionSummary[];
  setActiveProject: (projectId: string, name: string, currentRevisionId: string | null) => void;
  setRevisions: (revisions: import('@/api/types').RevisionSummary[]) => void;
  resetProject: () => void;
  // Selection
  selectedNodeId: string | null;
  setSelectedNode: (nodeId: string | null) => void;

  // Inspector panel
  isInspectorOpen: boolean;
  openInspector: (nodeId: string) => void;
  closeInspector: () => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Deployment status
  isDeploying: boolean;
  deploymentStatus: DeploymentStatus;
  setDeploymentStatus: (status: DeploymentStatus) => void;

  // Node statuses (from WebSocket events)
  nodeStatuses: Map<string, NodeStatus>;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  clearNodeStatuses: () => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  enterDraftMode: () => void;
  enterLiveMode: () => void;
  setHistoryMode: (revisionId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeProjectId: null,
  projectName: null,
  currentRevisionId: null,
  activeRevisionId: null,
  revisions: [],

  setActiveProject: (projectId, name, currentRevisionId) =>
    set({
      activeProjectId: projectId,
      projectName: name,
      currentRevisionId,
    }),

  setRevisions: (revisions) => set({ revisions }),

  resetProject: () =>
    set({
      activeProjectId: null,
      projectName: null,
      currentRevisionId: null,
      activeRevisionId: null,
      revisions: [],
      viewMode: 'live',
    }),

  selectedNodeId: null,
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  isInspectorOpen: false,
  openInspector: (nodeId) =>
    set({
      isInspectorOpen: true,
      selectedNodeId: nodeId,
    }),
  closeInspector: () =>
    set({
      isInspectorOpen: false,
      selectedNodeId: null,
    }),

  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  isDeploying: false,
  deploymentStatus: 'idle',
  setDeploymentStatus: (status) =>
    set({
      deploymentStatus: status,
      isDeploying: status === 'deploying',
    }),

  nodeStatuses: new Map(),
  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatuses: new Map(state.nodeStatuses).set(nodeId, status),
    })),
  clearNodeStatuses: () => set({ nodeStatuses: new Map() }),

  // View mode - default to live
  viewMode: 'live',
  setViewMode: (mode) => set({ viewMode: mode }),
  enterDraftMode: () =>
    set({
      viewMode: 'draft',
      activeRevisionId: null, // Draft is in-memory
    }),
  enterLiveMode: () =>
    set({
      viewMode: 'live',
      activeRevisionId: null,
    }),
  setHistoryMode: (revisionId) =>
    set({
      viewMode: 'history',
      activeRevisionId: revisionId,
    }),
}));
