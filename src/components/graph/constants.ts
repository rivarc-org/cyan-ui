// Grid and layout constants
export const GRID_SIZE = 50;
export const NODE_WIDTH = 300; // 6 * GRID_SIZE

// Node internal layout constants (for handle positioning)
export const NODE_HEADER_HEIGHT = 49; // p-3 padding (24px) + content (~20px line-height) + border (2px)
export const NODE_BODY_PADDING_TOP = 12; // p-3 padding
export const NODE_ROW_HEIGHT = 24; // h-6 on input labels
export const NODE_FIELD_ROW_HEIGHT = 50; // TextField/SecretField: label + gap + input
export const NODE_ROW_SPACING = 12; // space-y-3

// Status colors for node health indicators
export const statusColors: Record<string, string> = {
  pending: 'bg-gray-400',
  pulling: 'bg-yellow-400 animate-pulse',
  starting: 'bg-yellow-400 animate-pulse',
  running: 'bg-blue-400',
  healthy: 'bg-green-400',
  unhealthy: 'bg-orange-400',
  failed: 'bg-red-400',
};
