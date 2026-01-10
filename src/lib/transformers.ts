import type {
  GraphStateDTO,
  NodeStateDTO,
  PluginDetailResponse,
  InputDTO,
} from '@/api/types';
import type { PluginNode, GraphEdge } from '@/types/graph';

/**
 * Converts backend GraphState to React Flow nodes and edges.
 *
 * The backend stores dependencies as input values pointing to node IDs.
 * We need to:
 * 1. Create a React Flow node for each backend node
 * 2. Extract edges from plugin-type inputs where value is a node ID
 */
export function backendToFlow(
  graphState: GraphStateDTO,
  pluginMap: Map<string, PluginDetailResponse>
): { nodes: PluginNode[]; edges: GraphEdge[] } {
  const nodes: PluginNode[] = [];
  const edges: GraphEdge[] = [];

  // Build a set of node IDs for edge validation
  const nodeIds = new Set(graphState.nodes.map((n) => n.id));

  graphState.nodes.forEach((backendNode, index) => {
    const plugin = pluginMap.get(backendNode.plugin_id);
    if (!plugin) {
      console.warn(`Plugin ${backendNode.plugin_id} not found in library`);
      return;
    }

    // Create React Flow node
    const flowNode: PluginNode = {
      id: backendNode.id,
      type: 'plugin',
      position: calculatePosition(index),
      data: {
        pluginId: plugin.id,
        pluginName: plugin.name,
        image: plugin.image,
        category: plugin.category,
        inputs: plugin.inputs,
        exports: plugin.exports,
        inputValues: { ...backendNode.inputs },
      },
    };

    nodes.push(flowNode);

    // Extract edges from plugin-type inputs
    plugin.inputs.forEach((input) => {
      if (input.type === 'plugin') {
        const sourceNodeId = backendNode.inputs[input.id];

        // Validate that the source node exists
        if (sourceNodeId && nodeIds.has(sourceNodeId)) {
          edges.push({
            id: `${sourceNodeId}-${backendNode.id}-${input.id}`,
            source: sourceNodeId,
            sourceHandle: 'export', // All exports use single handle
            target: backendNode.id,
            targetHandle: input.id, // Handle ID matches input ID
            type: 'smoothstep',
          });
        }
      }
    });
  });

  return { nodes, edges };
}

/**
 * Converts React Flow nodes/edges back to backend GraphState.
 *
 * We need to:
 * 1. For each node, collect its input values
 * 2. For plugin-type inputs, the value should be the source node ID from the edge
 */
export function flowToBackend(
  nodes: PluginNode[],
  edges: GraphEdge[]
): GraphStateDTO {
  // Build edge lookup: targetId + handleId -> sourceId
  const edgeLookup = new Map<string, string>();
  edges.forEach((edge) => {
    const key = `${edge.target}:${edge.targetHandle}`;
    edgeLookup.set(key, edge.source);
  });

  const backendNodes: NodeStateDTO[] = nodes.map((node) => {
    const inputs: Record<string, string> = {};

    node.data.inputs.forEach((input) => {
      if (input.type === 'plugin') {
        // For plugin inputs, look up the connected source node
        const edgeKey = `${node.id}:${input.id}`;
        const sourceNodeId = edgeLookup.get(edgeKey);
        if (sourceNodeId) {
          inputs[input.id] = sourceNodeId;
        }
      } else {
        // For string/secret/port inputs, use the stored value
        const value = node.data.inputValues[input.id];
        if (value !== undefined && value !== '') {
          inputs[input.id] = value;
        }
      }
    });

    return {
      id: node.id,
      plugin_id: node.data.pluginId,
      inputs,
    };
  });

  return { nodes: backendNodes };
}

/**
 * Calculate initial node positions in a grid layout
 */
function calculatePosition(index: number): { x: number; y: number } {
  const COLUMNS = 3;
  const NODE_WIDTH = 320;
  const NODE_HEIGHT = 200;
  const GAP_X = 80;
  const GAP_Y = 60;

  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);

  return {
    x: col * (NODE_WIDTH + GAP_X) + 100,
    y: row * (NODE_HEIGHT + GAP_Y) + 100,
  };
}

/**
 * Build default input values from plugin definition
 */
export function buildDefaultInputValues(
  inputs: InputDTO[]
): Record<string, string> {
  const values: Record<string, string> = {};
  inputs.forEach((input) => {
    if (input.default) {
      values[input.id] = input.default;
    }
  });
  return values;
}

