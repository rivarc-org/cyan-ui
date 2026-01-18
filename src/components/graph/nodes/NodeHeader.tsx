import { memo } from 'react';
import { Database, Server, MoreVertical, Box, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColors } from '../constants';
import type { NodeStatus } from '@/types/graph';

const categoryIcons: Record<'worker' | 'stateful' | 'external', LucideIcon> = {
  worker: Server,
  stateful: Database,
  external: Box,
};

interface NodeHeaderProps {
  name: string;
  category: 'worker' | 'stateful' | 'external';
  status?: NodeStatus;
  onMenuClick: () => void;
}

function NodeHeaderComponent({ name, category, status, onMenuClick }: NodeHeaderProps) {
  const CategoryIcon = categoryIcons[category];

  return (
    <div className="flex items-center justify-between p-3 border-b border-border">
      <div className="flex items-center gap-2">
        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm truncate max-w-[180px]">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <div
            className={cn('w-2 h-2 rounded-full', statusColors[status])}
            title={status}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
          className="p-1 hover:bg-muted rounded"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export const NodeHeader = memo(NodeHeaderComponent);
