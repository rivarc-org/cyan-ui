import { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useValidationStore } from '@/stores/validationStore';

interface NodeErrorBannerProps {
  nodeId: string;
}

function NodeErrorBannerComponent({ nodeId }: NodeErrorBannerProps) {
  const errors = useValidationStore((state) => state.errorsByNode.get(nodeId));

  if (!errors || errors.length === 0) {
    return null;
  }

  const firstError = errors[0];
  const additionalCount = errors.length - 1;

  return (
    <div className="mt-2 mx-2 mb-2 bg-destructive/15 text-destructive px-2.5 py-1.5 text-xs rounded-md flex items-center gap-2">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate font-medium">
        {firstError.message}
        {additionalCount > 0 && (
          <span className="opacity-70 font-normal"> (+{additionalCount} more)</span>
        )}
      </span>
    </div>
  );
}

export const NodeErrorBanner = memo(NodeErrorBannerComponent);
