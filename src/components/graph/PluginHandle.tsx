import { Handle, Position } from '@xyflow/react';
import type { InputDTO } from '@/api/types';
import { cn } from '@/lib/utils';

interface InputHandleProps {
  input: InputDTO;
  index: number;
  totalInputs: number;
}

export function InputHandle({ input, index, totalInputs }: InputHandleProps) {
  // Only plugin-type inputs get connection handles
  if (input.type !== 'plugin') return null;

  // Calculate vertical position (evenly distributed)
  const topPercent = ((index + 1) / (totalInputs + 1)) * 100;

  return (
    <Handle
      type="target"
      position={Position.Left}
      id={input.id}
      style={{ top: `${topPercent}%` }}
      className={cn(
        'w-3 h-3 !bg-blue-500 border-2 border-white',
        'hover:!bg-blue-600 transition-colors'
      )}
    />
  );
}

interface ExportHandleProps {
  hasExports: boolean;
}

export function ExportHandle({ hasExports }: ExportHandleProps) {
  if (!hasExports) return null;

  return (
    <Handle
      type="source"
      position={Position.Right}
      id="export"
      style={{ top: '50%' }}
      className={cn(
        'w-3 h-3 !bg-green-500 border-2 border-white',
        'hover:!bg-green-600 transition-colors'
      )}
    />
  );
}
