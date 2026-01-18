import { Handle, Position } from '@xyflow/react';
import type { InputDTO } from '@/api/types';
import { cn } from '@/lib/utils';
import {
  NODE_HEADER_HEIGHT,
  NODE_BODY_PADDING_TOP,
  NODE_ROW_HEIGHT,
  NODE_FIELD_ROW_HEIGHT,
  NODE_ROW_SPACING,
} from './constants';

// Calculate pixel position for handle to align with row content
function getHandleTop(
  index: number,
  rowHeight: number = NODE_ROW_HEIGHT,
  baseOffset: number = 0
): number {
  // Position = header + body padding + base offset + half row height + (row index * (row height + spacing))
  return (
    NODE_HEADER_HEIGHT +
    NODE_BODY_PADDING_TOP +
    baseOffset +
    rowHeight / 2 +
    index * (rowHeight + NODE_ROW_SPACING)
  );
}

interface InputHandleProps {
  input: InputDTO;
  index: number;
}

export function InputHandle({ input, index }: InputHandleProps) {
  const topPx = getHandleTop(index);

  return (
    <Handle
      type="target"
      position={Position.Left}
      id={input.id}
      style={{ top: topPx }}
      className={cn(
        'w-3 h-3 !bg-blue-500 border-2 border-white',
        'hover:!bg-blue-600 transition-colors'
      )}
    />
  );
}

interface ExportHandleProps {
  id: string;
  index: number;
  /** Number of preceding rows (to calculate offset) */
  rowOffset?: number;
  /** Use field row height instead of default row height */
  useFieldHeight?: boolean;
}

export function ExportHandle({
  id,
  index,
  rowOffset = 0,
  useFieldHeight = false,
}: ExportHandleProps) {
  // Calculate base offset from preceding rows (using default row height)
  const baseOffset =
    rowOffset > 0 ? rowOffset * (NODE_ROW_HEIGHT + NODE_ROW_SPACING) : 0;

  const rowHeight = useFieldHeight ? NODE_FIELD_ROW_HEIGHT : NODE_ROW_HEIGHT;
  const topPx = getHandleTop(index, rowHeight, baseOffset);

  return (
    <Handle
      type="source"
      position={Position.Right}
      id={id}
      style={{ top: topPx }}
      className={cn(
        'w-3 h-3 !bg-green-500 border-2 border-white',
        'hover:!bg-green-600 transition-colors'
      )}
    />
  );
}
