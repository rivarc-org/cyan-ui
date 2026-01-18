import type {
  GraphStateDTO,
  NodeStateDTO,
  PluginDetailResponse,
  InputDTO,
} from '@/api/types';
import type { PluginNode, GraphEdge, ExternalInputField } from '@/types/graph';

// Special keys for encoding external node metadata in backend inputs
const EXTERNAL_NAME_KEY = '__external_name';
const EXTERNAL_FIELDS_KEY = '__external_fields';

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
    // Handle external nodes specially - they don't exist in the plugin library
    if (backendNode.plugin_id.startsWith('external://')) {
      const externalNode = reconstructExternalNode(backendNode, index);
      if (externalNode) {
        nodes.push(externalNode);
      }
      return;
    }

    const plugin = pluginMap.get(backendNode.plugin_id);
    if (!plugin) {
      console.warn(`Plugin ${backendNode.plugin_id} not found in library`);
      return;
    }

    // Create React Flow node - use category as node type for type-safe registry
    const flowNode: PluginNode = {
      id: backendNode.id,
      type: plugin.category, // Maps to nodeTypes registry (worker, stateful, external)
      position: backendNode.position || calculatePosition(index),
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

    // Extract edges from all input types (plugin, port, secret)
    plugin.inputs.forEach((input) => {
      const sourceNodeId = backendNode.inputs[input.id];

      // Validate that the source node exists and it's a node ID reference
      // (For port/secret types, it will be a node ID if it's a connection)
      if (sourceNodeId && nodeIds.has(sourceNodeId)) {
        // Find the source node's plugin to get its exports
        const sourceBackendNode = graphState.nodes.find(n => n.id === sourceNodeId);

        // Handle source handle - for external nodes, use the input.id itself as sourceHandle
        // since external nodes export values using their field names.
        // For regular plugin nodes, use first export or 'export'.
        let sourceHandle = 'export';
        if (sourceBackendNode) {
          if (sourceBackendNode.plugin_id.startsWith('external://')) {
            // It's an external node - the handle ID should match the field ID
            // However, we don't know the field ID here easily, but external nodes 
            // usually export with the ID of the field.
            // In most cases, if target is port/secret, it's connected to an external node.
            // We'll use the target input ID as a guess for the source handle if it matches,
            // or we'll just use 'export' as a fallback.
            // Actually, the backend should probably store the source handle too, 
            // but for now we'll assume the handle ID is what we saved in flowToBackend.
            // Wait, flowToBackend saves sourceHandle in the edge.
            // Ah, I see: flowToBackend doesn't save edges explicitly, it saves connections as input values.
            // So we need to recover the source handle. 
            // Since we don't store sourceHandle in the backend's `inputs` map, 
            // and we allow many-to-one, we have to guess or change backend schema.
            // BUT for external nodes, we usually connect 'field_name' -> 'input_name'.
            // Let's assume 'export' for now or try to find a matching export.
            sourceHandle = 'export';
          } else {
            const sourcePlugin = pluginMap.get(sourceBackendNode.plugin_id);
            sourceHandle = sourcePlugin?.exports?.[0]?.key || 'export';
          }
        }

        edges.push({
          id: `${sourceNodeId}-${backendNode.id}-${input.id}`,
          source: sourceNodeId,
          sourceHandle,
          target: backendNode.id,
          targetHandle: input.id, // Handle ID matches input ID
          type: 'smoothstep',
        });
      }
    });
  });

  return { nodes, edges };
}

/**
 * Reconstructs an external node from backend storage format.
 * External nodes store their metadata in special input keys.
 */
function reconstructExternalNode(
  backendNode: NodeStateDTO,
  index: number
): PluginNode | null {
  const { inputs } = backendNode;

  // Get external node name - required
  const name = inputs[EXTERNAL_NAME_KEY];
  if (!name) {
    console.warn(`External node ${backendNode.id} missing name metadata`);
    return null;
  }

  // Parse custom fields metadata
  let customFields: ExternalInputField[] = [];
  const fieldsJson = inputs[EXTERNAL_FIELDS_KEY];
  if (fieldsJson) {
    try {
      const fieldsMeta = JSON.parse(fieldsJson) as Array<{
        id: string;
        name: string;
        type: 'text' | 'secret';
      }>;
      // Reconstruct fields with their values from inputs
      customFields = fieldsMeta.map((meta) => ({
        ...meta,
        value: inputs[meta.id] || '',
      }));
    } catch (e) {
      console.warn(`Failed to parse external node fields: ${e}`);
    }
  }

  return {
    id: backendNode.id,
    type: 'external',
    position: backendNode.position || calculatePosition(index),
    data: {
      pluginId: 'external://custom',
      pluginName: name,
      category: 'external',
      inputs: [],
      exports: [],
      inputValues: {},
      isExternal: true,
      customFields,
    },
  };
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

    // Handle external nodes specially - store metadata and custom field values
    if (node.data.isExternal && node.data.customFields) {
      // Store the node name
      inputs[EXTERNAL_NAME_KEY] = node.data.pluginName;

      // Store field metadata (id, name, type - without values)
      const fieldsMeta = node.data.customFields.map(({ id, name, type }) => ({
        id,
        name,
        type,
      }));
      inputs[EXTERNAL_FIELDS_KEY] = JSON.stringify(fieldsMeta);

      // Store each field's value using its id as the key
      node.data.customFields.forEach((field) => {
        if (field.value !== undefined && field.value !== '') {
          inputs[field.id] = field.value;
        }
      });
    } else {
      // Regular nodes - process inputs normally
      node.data.inputs.forEach((input) => {
        const edgeKey = `${node.id}:${input.id}`;
        const sourceNodeId = edgeLookup.get(edgeKey);

        if (sourceNodeId) {
          // If connected, store the source node ID as the value
          inputs[input.id] = sourceNodeId;
        } else if (input.type !== 'plugin') {
          // For non-plugin inputs, if not connected, use the manual value
          const value = node.data.inputValues[input.id];
          if (value !== undefined && value !== '') {
            inputs[input.id] = value;
          }
        }
      });
    }

    return {
      id: node.id,
      plugin_id: node.data.pluginId,
      inputs,
      position: node.position,
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

