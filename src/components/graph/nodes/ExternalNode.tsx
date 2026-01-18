import { memo } from 'react';
import type { InputDTO } from '@/api/types';
import type { ExternalInputField } from '@/types/graph';
import { BaseNode } from './BaseNode';
import { InputHandle, ExportHandle } from '../handles';
import { PluginInputLabel, TextField, SecretField } from '../fields';
import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import type { ExternalNodeProps } from './types';

function ExternalNodeComponent({ id, data, selected }: ExternalNodeProps) {
  const updateNodeInput = useGraphStore((s) => s.updateNodeInput);
  const updateExternalField = useGraphStore((s) => s.updateExternalField);
  const openInspector = useUIStore((s) => s.openInspector);
  const nodeStatus = useUIStore((s) => s.nodeStatuses.get(id));
  const displayStatus = nodeStatus || data.status;

  // For External nodes: Only plugin-type inputs are left handles
  const leftInputs = data.inputs.filter((i: InputDTO) => i.type === 'plugin');

  // Editable inputs (non-plugin, non-generated, non-internal)
  const editableInputs = data.inputs.filter(
    (i: InputDTO) => i.type !== 'plugin' && !i.generate && i.id !== 'INTERNAL_PORT'
  );

  // Right outputs = editable inputs + custom fields
  const customs = data.customFields || [];
  const rightOutputs = [
    ...editableInputs.map((i) => ({ id: i.id })),
    ...customs.map((f) => ({ id: f.id })),
  ];

  const handles = (
    <>
      {leftInputs.map((input, idx) => (
        <InputHandle key={input.id} input={input} index={idx} />
      ))}
      {rightOutputs.map((output, idx) => (
        <ExportHandle
          key={output.id}
          id={output.id}
          index={idx}
          rowOffset={leftInputs.length}
          useFieldHeight
        />
      ))}
    </>
  );

  return (
    <BaseNode
      id={id}
      name={data.pluginName}
      category="external"
      status={displayStatus}
      selected={selected}
      handles={handles}
      onMenuClick={() => openInspector(id)}
    >
      {/* Plugin input labels */}
      {leftInputs.map((input: InputDTO) => (
        <PluginInputLabel key={input.id} input={input} />
      ))}

      {/* Editable input fields */}
      {editableInputs.map((input: InputDTO) =>
        input.type === 'secret' ? (
          <SecretField
            key={input.id}
            label={input.id}
            value={data.inputValues[input.id] || ''}
            onChange={(value) => updateNodeInput(id, input.id, value)}
            placeholder={input.default || 'Enter secret...'}
          />
        ) : (
          <TextField
            key={input.id}
            label={input.id}
            value={data.inputValues[input.id] || ''}
            onChange={(value) => updateNodeInput(id, input.id, value)}
            placeholder={input.default}
          />
        )
      )}

      {/* Custom fields */}
      {customs.map((field: ExternalInputField) =>
        field.type === 'secret' ? (
          <SecretField
            key={field.id}
            label={field.name}
            value={field.value || ''}
            onChange={(value) => updateExternalField(id, field.id, value)}
            placeholder={`Enter ${field.name}...`}
          />
        ) : (
          <TextField
            key={field.id}
            label={field.name}
            value={field.value || ''}
            onChange={(value) => updateExternalField(id, field.id, value)}
          />
        )
      )}
    </BaseNode>
  );
}

export const ExternalNode = memo(ExternalNodeComponent);
