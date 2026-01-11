import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Connection, EdgeChange, NodeChange, Node } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { PluginNode, GraphEdge, ExternalInputField } from '@/types/graph';
import type { GraphStateDTO, PluginDetailResponse } from '@/api/types';
import {
  backendToFlow,
  flowToBackend,
  buildDefaultInputValues,
} from '@/lib/transformers';

interface GraphState {
  // Graph data
  nodes: PluginNode[];
  edges: GraphEdge[];
  isDirty: boolean;
  isInitialized: boolean;

  // React Flow handlers
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // CRUD operations
  addNode: (
    plugin: PluginDetailResponse,
    position?: { x: number; y: number }
  ) => string;
  addExternalNode: (
    name: string,
    fields: ExternalInputField[],
    position?: { x: number; y: number }
  ) => string;
  removeNode: (nodeId: string) => void;
  updateNodeInput: (nodeId: string, inputId: string, value: string) => void;
  updateExternalField: (nodeId: string, fieldId: string, value: string) => void;
  updateNodeImage: (nodeId: string, image: string) => void;

  // Canvas loading from backend
  loadCanvas: (
    graphState: GraphStateDTO,
    pluginMap: Map<string, PluginDetailResponse>
  ) => void;

  // Get current state for backend
  getGraphState: () => GraphStateDTO;

  // Bulk operations
  setGraph: (nodes: PluginNode[], edges: GraphEdge[]) => void;
  setInitialized: (initialized: boolean) => void;
  clearGraph: () => void;

  // Dirty state tracking
  markClean: () => void;
}

// Track drag state for history batching
let isDragging = false;

// Create store with temporal middleware for undo/redo
export const useGraphStore = create<GraphState>()(
  temporal(
    (set, get) => ({
      nodes: [],
      edges: [],
      isDirty: false,
      isInitialized: false,

      onNodesChange: (changes) => {
        // Check for drag start/end to batch history
        const positionChanges = changes.filter(
          (
            c
          ): c is NodeChange<Node> & { type: 'position'; dragging?: boolean } =>
            c.type === 'position'
        );
        const dragStart = positionChanges.some((c) => c.dragging === true);
        const dragEnd = positionChanges.some((c) => c.dragging === false);

        // Pause history during drag to avoid per-frame entries
        if (dragStart && !isDragging) {
          isDragging = true;
          useGraphStore.temporal.getState().pause();
        }

        // Apply the changes
        set({
          nodes: applyNodeChanges(changes, get().nodes as Node[]) as PluginNode[],
          isDirty:
            get().isInitialized &&
            (get().isDirty ||
              changes.some((c) => c.type === 'position' || c.type === 'remove')),
        });

        // Resume history after drag ends (captures single entry)
        if (dragEnd && isDragging) {
          isDragging = false;
          useGraphStore.temporal.getState().resume();
        }
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
          isDirty:
            get().isInitialized &&
            (get().isDirty || changes.some((c) => c.type === 'remove')),
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

      addNode: (plugin, position) => {
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newNode: PluginNode = {
          id: nodeId,
          type: 'plugin',
          position: position || { x: 200, y: 200 },
          data: {
            pluginId: plugin.id,
            pluginName: plugin.name,
            image: plugin.image,
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

      addExternalNode: (name, fields, position) => {
        const nodeId = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newNode: PluginNode = {
          id: nodeId,
          type: 'plugin',
          position: position || { x: 200, y: 200 },
          data: {
            pluginId: 'external://custom',
            pluginName: name,
            category: 'external',
            inputs: [],
            exports: [],
            inputValues: {},
            isExternal: true,
            customFields: fields,
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

      updateExternalField: (nodeId, fieldId, value) => {
        const { nodes } = get();
        set({
          nodes: nodes.map((node) =>
            node.id === nodeId && node.data.customFields
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    customFields: node.data.customFields.map((field) =>
                      field.id === fieldId ? { ...field, value } : field
                    ),
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

      /**
       * Load a canvas from backend GraphStateDTO.
       * Clears undo history and resets dirty state.
       */
      loadCanvas: (graphState, pluginMap) => {
        const { nodes, edges } = backendToFlow(graphState, pluginMap);

        set({
          nodes,
          edges,
          isDirty: false,
          isInitialized: false,
        });

        // Clear undo history when loading new canvas
        useGraphStore.temporal.getState().clear();

        // Schedule initialization to enable dirty tracking
        setTimeout(() => {
          set({ isInitialized: true });
        }, 50);
      },

      /**
       * Get current graph state in backend format.
       */
      getGraphState: () => {
        const { nodes, edges } = get();
        return flowToBackend(nodes, edges);
      },

      setGraph: (nodes, edges) => {
        set({ nodes, edges, isDirty: false, isInitialized: false });
      },

      setInitialized: (isInitialized) => {
        set({ isInitialized });
      },

      clearGraph: () => {
        set({ nodes: [], edges: [], isDirty: true, isInitialized: false });
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

// Backward compatibility alias - remove after migration
export const useCanvasStore = useGraphStore;

// Helper for temporal hooks
export const useTemporalStore = () => useGraphStore.temporal;
