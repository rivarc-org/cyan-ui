// Grid and layout constants
export const GRID_SIZE = 50;
export const NODE_WIDTH = 300; // 6 * GRID_SIZE

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
