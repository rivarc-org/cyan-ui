import { memo } from 'react';
import type { InputDTO } from '@/api/types';
import { BaseNode } from './BaseNode';
import { InputHandle, ExportHandle } from '../handles';
import { PluginInputLabel } from '../fields';
import { useUIStore } from '@/stores/uiStore';
import type { StatefulNodeProps } from './types';

function StatefulNodeComponent({ id, data, selected }: StatefulNodeProps) {
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));
  const displayStatus = nodeStatus || data.status;

  // All inputs to display (exclude INTERNAL_PORT and auto-generated)
  const displayInputs = data.inputs.filter(
    (i: InputDTO) => i.id !== 'INTERNAL_PORT' && !i.generate
  );
  const rightOutputs = data.exports.map((e) => ({ id: e.key }));

  // All display inputs get connection handles (plugin, port, secret)
  const handles = (
    <>
      {displayInputs.map((input, idx) => (
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
      category="stateful"
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

export const StatefulNode = memo(StatefulNodeComponent);
