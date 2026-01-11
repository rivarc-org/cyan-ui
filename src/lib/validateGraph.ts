import type { GraphStateDTO, PluginDetailResponse } from '@/api/types';

export interface GraphError {
  type: 'missing_input' | 'type_mismatch' | 'cycle_detected' | 'missing_plugin';
  nodeId: string;
  inputId?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates the graph state against plugin definitions.
 *
 * Checks that:
 * - All nodes reference valid plugins
 * - All plugin-type inputs point to existing nodes
 * - Input types match what plugins expect
 *
 * For Phase 1: Returns empty array (placeholder).
 * Future: Implement full type checking.
 */
export function checkTypes(
  _graphState: GraphStateDTO,
  _plugins: PluginDetailResponse[]
): GraphError[] {
  // Placeholder implementation - returns no errors
  // TODO: Implement full type checking in future phase
  return [];
}

/**
 * Validates a single connection before it's made.
 * Returns whether the connection is valid and an optional error message.
 */
export function validateConnection(
  sourceNodeId: string,
  targetNodeId: string,
  targetInputId: string,
  graphState: GraphStateDTO,
  plugins: PluginDetailResponse[]
): { valid: boolean; error?: string } {
  // No self-connections
  if (sourceNodeId === targetNodeId) {
    return { valid: false, error: 'Cannot connect node to itself' };
  }

  const pluginMap = new Map(plugins.map((p) => [p.id, p]));
  const sourceNode = graphState.nodes.find((n) => n.id === sourceNodeId);
  const targetNode = graphState.nodes.find((n) => n.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return { valid: false, error: 'Node not found' };
  }

  const targetPlugin = pluginMap.get(targetNode.plugin_id);
  if (!targetPlugin) {
    return { valid: false, error: 'Target plugin not found' };
  }

  const targetInput = targetPlugin.inputs.find(
    (i) => i.id === targetInputId && i.type === 'plugin'
  );
  if (!targetInput) {
    return { valid: false, error: 'Invalid target input' };
  }

  if (targetInput.accepts && targetInput.accepts !== sourceNode.plugin_id) {
    return { valid: false, error: `Input requires ${targetInput.accepts}` };
  }

  return { valid: true };
}
