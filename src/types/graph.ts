import type { Node, Edge } from '@xyflow/react';
import type { InputDTO, ExportDTO } from '@/api/types';

export type NodeStatus =
  | 'pending'
  | 'pulling'
  | 'starting'
  | 'running'
  | 'healthy'
  | 'unhealthy'
  | 'failed';

// Custom node data structure for plugin nodes
// Extends Record<string, unknown> to satisfy React Flow's type requirements
export interface PluginNodeData extends Record<string, unknown> {
  pluginId: string;
  pluginName: string;
  image: string;
  category: 'worker' | 'stateful';
  inputs: InputDTO[];
  exports: ExportDTO[];
  inputValues: Record<string, string>;
  status?: NodeStatus;
}

// Plugin node is a React Flow node with our custom data
export type PluginNode = Node<PluginNodeData, 'plugin'>;

// Standard edge type
export type GraphEdge = Edge;
