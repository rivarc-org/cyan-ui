import type { GraphStateDTO, PluginDetailResponse } from '@/api/types';
import type { PluginNode, GraphEdge } from '@/types/graph';

export interface GraphError {
  type: 'missing_input' | 'type_mismatch' | 'cycle_detected' | 'missing_plugin';
  nodeId: string;
  inputId?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates React Flow nodes for missing required inputs.
 * Used for real-time validation in the editor.
 *
 * Validation rules:
 * - plugin inputs: Must have an incoming edge connection
 * - port/secret inputs: Must have either a default value or user value
 * - Inputs with generate: true are skipped (auto-generated)
 * - External nodes are skipped (different validation rules)
 */
export function checkNodeTypes(
  nodes: PluginNode[],
  edges: GraphEdge[]
): GraphError[] {
  const errors: GraphError[] = [];

  // Build lookup: target nodeId + targetHandle -> has incoming edge
  const connectedInputs = new Set<string>();
  for (const edge of edges) {
    if (edge.target && edge.targetHandle) {
      connectedInputs.add(`${edge.target}:${edge.targetHandle}`);
    }
  }

  for (const node of nodes) {
    // Skip external nodes
    if (node.data.isExternal || node.data.category === 'external') {
      continue;
    }

    for (const input of node.data.inputs) {
      // Skip auto-generated inputs and internal ports
      if (input.generate || input.id === 'INTERNAL_PORT') {
        continue;
      }

      if (input.type === 'plugin') {
        // Plugin inputs must have an incoming edge
        const key = `${node.id}:${input.id}`;
        if (!connectedInputs.has(key)) {
          errors.push({
            type: 'missing_input',
            nodeId: node.id,
            inputId: input.id,
            message: `Missing required connection: ${input.id}`,
            severity: 'error',
          });
        }
      } else if (input.type === 'port' || input.type === 'secret') {
        // Port/secret inputs must have a value or default
        const hasDefault = input.default !== undefined && input.default !== '';
        const hasValue =
          node.data.inputValues[input.id] !== undefined &&
          node.data.inputValues[input.id] !== '';

        if (!hasDefault && !hasValue) {
          errors.push({
            type: 'missing_input',
            nodeId: node.id,
            inputId: input.id,
            message: `Missing required value: ${input.id}`,
            severity: 'error',
          });
        }
      }
    }
  }

  return errors;
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
  // TODO: Implement full type checking
  // TODO: Implement checks to make sure all required inputs are set
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
