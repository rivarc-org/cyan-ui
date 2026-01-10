import { create } from 'zustand';
import type { NodeStatus } from '@/types/graph';

type DeploymentStatus = 'idle' | 'deploying' | 'success' | 'failed';

interface UIState {
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
}

export const useUIStore = create<UIState>((set) => ({
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
}));
