import { memo } from 'react';
import { Database, Server, MoreVertical, Box } from 'lucide-react';
import type { PluginNodeData, ExternalInputField } from '@/types/graph';
import type { InputDTO } from '@/api/types';
import { InputHandle, ExportHandle } from './PluginHandle';
import { SecureInput } from './SecureInput';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const NODE_WIDTH = 280;

const statusColors: Record<string, string> = {
  pending: 'bg-gray-400',
  pulling: 'bg-yellow-400 animate-pulse',
  starting: 'bg-yellow-400 animate-pulse',
  running: 'bg-blue-400',
  healthy: 'bg-green-400',
  unhealthy: 'bg-orange-400',
  failed: 'bg-red-400',
};

interface PluginNodeProps {
  id: string;
  data: PluginNodeData;
  selected?: boolean;
}

function PluginNodeComponent({ id, data, selected }: PluginNodeProps) {
  const nodeData = data;
  const updateNodeInput = useCanvasStore((s) => s.updateNodeInput);
  const updateExternalField = useCanvasStore((s) => s.updateExternalField);
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));
  const viewMode = useUIStore((s) => s.viewMode);

  // Only show status dots in live mode
  const shouldShowStatus = viewMode.type === 'live';
  const displayStatus = shouldShowStatus ? (nodeStatus || nodeData.status) : undefined;

  const pluginInputs = nodeData.inputs.filter((i: InputDTO) => i.type === 'plugin');

  // Only external nodes get editable inputs
  const editableInputs = nodeData.isExternal
    ? nodeData.inputs.filter(
      (i: InputDTO) => i.type !== 'plugin' && !i.generate && i.id !== 'INTERNAL_PORT'
    )
    : [];

  // Choose icon based on category
  const CategoryIcon = nodeData.category === 'external'
    ? Box
    : nodeData.category === 'stateful'
      ? Database
      : Server;

  // Check if there's any content to show in the body


  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-lg shadow-lg border-2 transition-all',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
        'relative'
      )}
      style={{ width: NODE_WIDTH }}
    >
      {/* Handles - Left side for plugin inputs */}
      {pluginInputs.map((input, idx) => (
        <InputHandle
          key={input.id}
          input={input}
          index={idx}
          totalInputs={pluginInputs.length}
        />
      ))}

      {/* Handle - Right side for exports */}
      <ExportHandle hasExports={nodeData.exports.length > 0 || !!nodeData.isExternal} />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate max-w-[180px]">
            {nodeData.pluginName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {displayStatus && (
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                statusColors[displayStatus]
              )}
              title={displayStatus}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openInspector(id);
            }}
            className="p-1 hover:bg-muted rounded"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Body - Inputs and custom fields */}
      <div className="p-3 space-y-3">


        {/* Plugin connection labels (left side) */}
        {pluginInputs.map((input: InputDTO) => (
          <div
            key={input.id}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              {input.id.replace(/_/g, ' ')}
              {input.accepts && (
                <span className="text-muted-foreground/70 ml-1">
                  ({input.accepts.split('.').pop()})
                </span>
              )}
            </span>
          </div>
        ))}

        {/* Editable input fields (external nodes only) */}
        {editableInputs.map((input: InputDTO) => (
          <div key={input.id} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {input.id.replace(/_/g, ' ')}
            </label>
            {input.type === 'secret' ? (
              <SecureInput
                value={nodeData.inputValues[input.id] || ''}
                onChange={(value) => updateNodeInput(id, input.id, value)}
                placeholder={input.default || 'Enter secret...'}
              />
            ) : (
              <input
                type="text"
                value={nodeData.inputValues[input.id] || ''}
                onChange={(e) => updateNodeInput(id, input.id, e.target.value)}
                placeholder={input.default || ''}
                className={cn(
                  'nodrag w-full px-2 py-1 text-sm border border-input rounded',
                  'bg-background text-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-ring'
                )}
              />
            )}
          </div>
        ))}

        {/* Custom fields for external nodes */}
        {nodeData.isExternal && nodeData.customFields?.map((field: ExternalInputField) => (
          <div key={field.id} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {field.name}
            </label>
            {field.type === 'secret' ? (
              <SecureInput
                value={field.value || ''}
                onChange={(value) => updateExternalField(id, field.id, value)}
                placeholder={`Enter ${field.name}...`}
              />
            ) : (
              <input
                type="text"
                value={field.value || ''}
                onChange={(e) => updateExternalField(id, field.id, e.target.value)}
                placeholder=""
                className={cn(
                  'nodrag w-full px-2 py-1 text-sm border border-input rounded',
                  'bg-background text-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-ring'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer - Image tag */}

    </div>
  );
}

export const PluginNode = memo(PluginNodeComponent);
