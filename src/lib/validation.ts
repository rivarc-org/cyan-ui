import type { Connection } from '@xyflow/react';
import type { PluginNode } from '@/types/graph';

/**
 * Validates whether a connection between two nodes is allowed.
 *
 * Rules:
 * 1. Cannot connect a node to itself
 * 2. Target handle must be a plugin-type input
 * 3. Source node's plugin_id must match the input's "accepts" field
 */
export function isValidConnection(
  connection: Connection,
  nodes: PluginNode[]
): boolean {
  const { source, target, targetHandle } = connection;

  // Rule 1: No self-connections
  if (source === target) {
    return false;
  }

  // Must have source and target
  if (!source || !target) {
    return false;
  }

  // Find source and target nodes
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  // Rule 2 & 3: Check if target handle is a valid input
  const targetInput = targetNode.data.inputs.find(
    (i) => i.id === targetHandle
  );

  if (!targetInput) {
    return false; // Target handle is not an input
  }

  // If the input expects a specific plugin, check compatibility
  if (targetInput.type === 'plugin') {
    if (targetInput.accepts && targetInput.accepts !== sourceNode.data.pluginId) {
      return false; // Plugin type mismatch
    }
  }

  return true;
}
