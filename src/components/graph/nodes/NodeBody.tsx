import { memo, type ReactNode } from 'react';

interface NodeBodyProps {
  children: ReactNode;
}

function NodeBodyComponent({ children }: NodeBodyProps) {
  return <div className="p-3 space-y-3">{children}</div>;
}

export const NodeBody = memo(NodeBodyComponent);
