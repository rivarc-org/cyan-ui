import { memo } from 'react';
import type { InputDTO } from '@/api/types';

interface PluginInputLabelProps {
  input: InputDTO;
}

function PluginInputLabelComponent({ input }: PluginInputLabelProps) {
  return (
    <div className="flex items-center text-xs text-muted-foreground h-6">
      <span>
        {input.id.replace(/_/g, ' ')}
        {input.accepts && (
          <span className="text-muted-foreground/70 ml-1">
            ({input.accepts.split('.').pop()})
          </span>
        )}
      </span>
    </div>
  );
}

export const PluginInputLabel = memo(PluginInputLabelComponent);
