import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useNodeResize } from '../useNodeResize';
import { NODE_WIDTH } from '../constants';
import { NodeHeader } from './NodeHeader';
import { NodeBody } from './NodeBody';
import type { NodeStatus } from '@/types/graph';

interface BaseNodeProps {
  id: string;
  name: string;
  category: 'worker' | 'stateful' | 'external';
  status?: NodeStatus;
  selected?: boolean;
  handles?: ReactNode;
  children: ReactNode;
  onMenuClick: () => void;
}

function BaseNodeComponent({
  name,
  category,
  status,
  selected,
  handles,
  children,
  onMenuClick,
}: BaseNodeProps) {
  const { nodeRef, contentRef } = useNodeResize();

  return (
    <div
      ref={nodeRef}
      className={cn(
        'bg-card text-card-foreground rounded-lg shadow-lg border-2 transition-all',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
        'relative'
      )}
      style={{ width: NODE_WIDTH }}
    >
      {/* Handles rendered outside content wrapper */}
      {handles}

      {/* Content wrapper for measuring height */}
      <div ref={contentRef}>
        <NodeHeader
          name={name}
          category={category}
          status={status}
          onMenuClick={onMenuClick}
        />
        <NodeBody>{children}</NodeBody>
      </div>
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
