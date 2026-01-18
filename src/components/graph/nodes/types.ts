import type { PluginNodeData } from '@/types/graph';

// Re-export types from central types file
export type { PluginNodeData, NodeCategory, ExternalInputField } from '@/types/graph';

// Props interface for node components (matches React Flow's internal props)
export interface PluginNodeProps {
  id: string;
  data: PluginNodeData;
  selected?: boolean;
}

// Alias types for each category node (all use the same props shape)
export type WorkerNodeProps = PluginNodeProps;
export type StatefulNodeProps = PluginNodeProps;
export type ExternalNodeProps = PluginNodeProps;

// Helper type guards for runtime type checking
export function isWorkerNode(data: PluginNodeData): boolean {
  return data.category === 'worker';
}

export function isStatefulNode(data: PluginNodeData): boolean {
  return data.category === 'stateful';
}

export function isExternalNode(data: PluginNodeData): boolean {
  return data.category === 'external';
}
