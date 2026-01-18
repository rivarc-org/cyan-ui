import { memo } from 'react';
import type { InputDTO } from '@/api/types';
import { BaseNode } from './BaseNode';
import { InputHandle, ExportHandle } from '../handles';
import { PluginInputLabel } from '../fields';
import { useUIStore } from '@/stores/uiStore';
import type { WorkerNodeProps } from './types';

function WorkerNodeComponent({ id, data, selected }: WorkerNodeProps) {
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));
  const displayStatus = nodeStatus || data.status;

  // All inputs to display (exclude INTERNAL_PORT)
  const displayInputs = data.inputs.filter(
    (i: InputDTO) => i.id !== 'INTERNAL_PORT'
  );
  const rightOutputs = data.exports.map((e) => ({ id: e.key }));

  // Only plugin-type inputs get connection handles
  // Use the original index from displayInputs for correct positioning
  const handles = (
    <>
      {displayInputs.map((input, idx) =>
        input.type === 'plugin' ? (
          <InputHandle key={input.id} input={input} index={idx} />
        ) : null
      )}
      {rightOutputs.map((output, idx) => (
        <ExportHandle key={output.id} id={output.id} index={idx} />
      ))}
    </>
  );

  return (
    <BaseNode
      id={id}
      name={data.pluginName}
      category="worker"
      status={displayStatus}
      selected={selected}
      handles={handles}
      onMenuClick={() => openInspector(id)}
    >
      {displayInputs.map((input: InputDTO) => (
        <PluginInputLabel key={input.id} input={input} />
      ))}
    </BaseNode>
  );
}

export const WorkerNode = memo(WorkerNodeComponent);
