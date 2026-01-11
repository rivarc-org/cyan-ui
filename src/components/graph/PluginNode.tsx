import { memo } from 'react';
import { Database, Server, MoreVertical, Box } from 'lucide-react';
import type { PluginNodeData, ExternalInputField } from '@/types/graph';
import type { InputDTO } from '@/api/types';
import { InputHandle, ExportHandle } from './PluginHandle';
import { SecureInput } from './SecureInput';
import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
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
  const updateNodeInput = useGraphStore((s) => s.updateNodeInput);
  const updateExternalField = useGraphStore((s) => s.updateExternalField);
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));

  // Show status when available (from WebSocket events)
  const displayStatus = nodeStatus || nodeData.status;

  // Determine Left Handles (Inputs)
  // For External nodes: Only plugin inputs are inputs (others are fields/outputs)
  // For Plugin nodes: All inputs are inputs
  const leftInputs = nodeData.isExternal
    ? nodeData.inputs.filter((i: InputDTO) => i.type === 'plugin')
    : nodeData.inputs.filter((i: InputDTO) => i.id !== 'INTERNAL_PORT');

  // Determine Right Handles (Outputs)
  // For External nodes: Fields (editable inputs + custom fields) are outputs
  // For Plugin nodes: Exports are outputs
  let rightOutputs: { id: string }[] = [];
  
  const editableInputs = nodeData.inputs.filter(
    (i: InputDTO) => i.type !== 'plugin' && !i.generate && i.id !== 'INTERNAL_PORT'
  );

  if (nodeData.isExternal) {
    const customs = nodeData.customFields || [];
    rightOutputs = [
      ...editableInputs.map(i => ({ id: i.id })),
      ...customs.map(f => ({ id: f.id }))
    ];
  } else {
    rightOutputs = nodeData.exports.map(e => ({ id: e.key }));
  }

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
      {/* Handles - Left side for inputs */}
      {leftInputs.map((input, idx) => (
        <InputHandle
          key={input.id}
          input={input}
          index={idx}
          totalInputs={leftInputs.length}
        />
      ))}

      {/* Handles - Right side for outputs */}
      {rightOutputs.map((output, idx) => (
        <ExportHandle
          key={output.id}
          id={output.id}
          index={idx}
          totalExports={rightOutputs.length}
        />
      ))}

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


        {/* Plugin/Left Inputs labels */}
        {leftInputs.map((input: InputDTO) => (
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

        {/* Editable input fields (Only for external nodes, they act as outputs visually but inputs data-wise) */}
        {nodeData.isExternal && editableInputs.map((input: InputDTO) => (
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
