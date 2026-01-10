import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  Connection,
  EdgeChange,
  NodeChange,
  Node,
} from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { PluginNode, GraphEdge } from '@/types/graph';
import type { PluginDetailResponse } from '@/api/types';
import { buildDefaultInputValues } from '@/lib/transformers';

interface CanvasState {
  // Graph data
  nodes: PluginNode[];
  edges: GraphEdge[];
  isDirty: boolean;

  // Node operations
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // CRUD operations
  addNode: (
    plugin: PluginDetailResponse,
    image: string,
    position?: { x: number; y: number }
  ) => string;
  removeNode: (nodeId: string) => void;
  updateNodeInput: (nodeId: string, inputId: string, value: string) => void;
  updateNodeImage: (nodeId: string, image: string) => void;

  // Bulk operations
  setGraph: (nodes: PluginNode[], edges: GraphEdge[]) => void;
  clearGraph: () => void;

  // Dirty state tracking
  markClean: () => void;
}

// Create store with temporal middleware for undo/redo
export const useCanvasStore = create<CanvasState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      isDirty: false,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes as Node[]) as PluginNode[],
          isDirty: true,
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
          isDirty: true,
        });
      },

      onConnect: (connection) => {
        if (!connection.source || !connection.target) return;

        const { edges } = get();

        // Remove any existing edge to the same target handle
        const filteredEdges = edges.filter(
          (e) =>
            !(
              e.target === connection.target &&
              e.targetHandle === connection.targetHandle
            )
        );

        // Add new edge
        const newEdge: GraphEdge = {
          id: `${connection.source}-${connection.target}-${connection.targetHandle}`,
          source: connection.source,
          sourceHandle: connection.sourceHandle || 'export',
          target: connection.target,
          targetHandle: connection.targetHandle || '',
          type: 'smoothstep',
        };

        set({
          edges: [...filteredEdges, newEdge],
          isDirty: true,
        });
      },

      addNode: (plugin, image, position) => {
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newNode: PluginNode = {
          id: nodeId,
          type: 'plugin',
          position: position || { x: 200, y: 200 },
          data: {
            pluginId: plugin.id,
            pluginName: plugin.name,
            image,
            category: plugin.category,
            inputs: plugin.inputs,
            exports: plugin.exports,
            inputValues: buildDefaultInputValues(plugin.inputs),
          },
        };

        set({
          nodes: [...get().nodes, newNode],
          isDirty: true,
        });

        return nodeId;
      },

      removeNode: (nodeId) => {
        const { nodes, edges } = get();
        set({
          nodes: nodes.filter((n) => n.id !== nodeId),
          edges: edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          isDirty: true,
        });
      },

      updateNodeInput: (nodeId, inputId, value) => {
        const { nodes } = get();
        set({
          nodes: nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    inputValues: {
                      ...node.data.inputValues,
                      [inputId]: value,
                    },
                  },
                }
              : node
          ),
          isDirty: true,
        });
      },

      updateNodeImage: (nodeId, image) => {
        const { nodes } = get();
        set({
          nodes: nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: { ...node.data, image },
                }
              : node
          ),
          isDirty: true,
        });
      },

      setGraph: (nodes, edges) => {
        set({ nodes, edges, isDirty: false });
      },

      clearGraph: () => {
        set({ nodes: [], edges: [], isDirty: true });
      },

      markClean: () => {
        set({ isDirty: false });
      },
    }),
    {
      // Zundo options
      limit: 50, // Keep 50 undo states
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);

// Helper for temporal hooks
export const useTemporalStore = () => useCanvasStore.temporal;
