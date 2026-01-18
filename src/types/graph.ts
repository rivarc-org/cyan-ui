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

// External node custom field definition
export interface ExternalInputField {
  id: string;
  name: string;
  type: 'text' | 'secret';
  value: string;
}

// Node category types - extends backend types with 'external' for custom nodes
export type NodeCategory = 'worker' | 'stateful' | 'external';

// Custom node data structure for plugin nodes
// Extends Record<string, unknown> to satisfy React Flow's type requirements
export interface PluginNodeData extends Record<string, unknown> {
  pluginId: string;
  pluginName: string;
  category: NodeCategory;
  inputs: InputDTO[];
  exports: ExportDTO[];
  inputValues: Record<string, string>;
  status?: NodeStatus;
  isExternal?: boolean;
  customFields?: ExternalInputField[];
}

// Plugin node is a React Flow node with our custom data
export type PluginNode = Node<PluginNodeData, NodeCategory>;

// Standard edge type
export type GraphEdge = Edge;
