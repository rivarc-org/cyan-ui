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

  // Filter inputs (exclude INTERNAL_PORT)
  const leftInputs = data.inputs.filter((i: InputDTO) => i.id !== 'INTERNAL_PORT');
  const rightOutputs = data.exports.map((e) => ({ id: e.key }));

  const handles = (
    <>
      {leftInputs.map((input, idx) => (
        <InputHandle key={input.id} input={input} index={idx} />
      ))}
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
      {leftInputs.map((input: InputDTO) => (
        <PluginInputLabel key={input.id} input={input} />
      ))}
    </BaseNode>
  );
}

export const WorkerNode = memo(WorkerNodeComponent);
