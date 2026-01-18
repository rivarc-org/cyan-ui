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

  console.log('[isValidConnection] Checking:', { source, target, targetHandle });

  // Rule 1: No self-connections
  if (source === target) {
    console.log('[isValidConnection] Rejected: self-connection');
    return false;
  }

  // Must have source and target
  if (!source || !target) {
    console.log('[isValidConnection] Rejected: missing source or target');
    return false;
  }

  // Find source and target nodes
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  if (!sourceNode || !targetNode) {
    console.log('[isValidConnection] Rejected: node not found');
    return false;
  }

  // Rule 2 & 3: Check if target handle is a valid input
  const targetInput = targetNode.data.inputs.find(
    (i) => i.id === targetHandle
  );

  if (!targetInput) {
    console.log('[isValidConnection] Rejected: target handle not found in inputs', {
      targetHandle,
      availableInputs: targetNode.data.inputs.map(i => i.id)
    });
    return false; // Target handle is not an input
  }

  // For plugin-type inputs, check accepts compatibility
  if (targetInput.type === 'plugin') {
    if (targetInput.accepts && targetInput.accepts !== sourceNode.data.pluginId) {
      console.log('[isValidConnection] Rejected: plugin type mismatch', {
        accepts: targetInput.accepts,
        sourcePluginId: sourceNode.data.pluginId
      });
      return false; // Plugin type mismatch
    }
  }

  // For port/secret inputs, only allow connections from external nodes
  if (targetInput.type === 'port' || targetInput.type === 'secret') {
    if (!sourceNode.data.isExternal) {
      console.log('[isValidConnection] Rejected: port/secret inputs can only receive from external nodes');
      return false;
    }
  }

  console.log('[isValidConnection] Accepted');
  return true;
}
