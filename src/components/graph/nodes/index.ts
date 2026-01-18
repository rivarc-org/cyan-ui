import type { NodeTypes } from '@xyflow/react';
import { WorkerNode } from './WorkerNode';
import { StatefulNode } from './StatefulNode';
import { ExternalNode } from './ExternalNode';

// Node type registry for React Flow
// Maps category strings to their corresponding React components
// Type assertion needed due to React Flow's strict generic typing
export const nodeTypes: NodeTypes = {
  worker: WorkerNode,
  stateful: StatefulNode,
  external: ExternalNode,
};

// Export individual node components
export { WorkerNode } from './WorkerNode';
export { StatefulNode } from './StatefulNode';
export { ExternalNode } from './ExternalNode';

// Export shared components
export { BaseNode } from './BaseNode';
export { NodeHeader } from './NodeHeader';
export { NodeBody } from './NodeBody';

// Export types
export * from './types';
