import { memo } from 'react';
import { Database, Server, MoreVertical } from 'lucide-react';
import type { PluginNodeData } from '@/types/graph';
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
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));

  const pluginInputs = nodeData.inputs.filter((i: InputDTO) => i.type === 'plugin');
  const editableInputs = nodeData.inputs.filter(
    (i: InputDTO) => i.type !== 'plugin' && !i.generate
  );

  const CategoryIcon = nodeData.category === 'stateful' ? Database : Server;

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg border-2 transition-all',
        selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-200',
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
      <ExportHandle hasExports={nodeData.exports.length > 0} />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm truncate max-w-[180px]">
            {nodeData.pluginName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(nodeStatus || nodeData.status) && (
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                statusColors[nodeStatus || nodeData.status || 'pending']
              )}
              title={nodeStatus || nodeData.status}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openInspector(id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Body - Editable inputs */}
      <div className="p-3 space-y-3">
        {editableInputs.length === 0 && pluginInputs.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            No configuration required
          </p>
        )}

        {/* Plugin connection labels (left side) */}
        {pluginInputs.map((input: InputDTO) => (
          <div
            key={input.id}
            className="flex items-center gap-2 text-xs text-gray-500"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>
              {input.id.replace(/_/g, ' ')}
              {input.accepts && (
                <span className="text-gray-400 ml-1">
                  ({input.accepts.split('.').pop()})
                </span>
              )}
            </span>
          </div>
        ))}

        {/* Editable input fields */}
        {editableInputs.map((input: InputDTO) => (
          <div key={input.id} className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
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
                  'nodrag w-full px-2 py-1 text-sm border border-gray-200 rounded',
                  'focus:outline-none focus:ring-1 focus:ring-blue-500'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer - Image tag */}
      <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <p className="text-xs text-gray-400 truncate" title={nodeData.image}>
          {nodeData.image}
        </p>
      </div>
    </div>
  );
}

export const PluginNode = memo(PluginNodeComponent);
