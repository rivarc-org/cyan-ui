import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextFieldComponent({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label.replace(/_/g, ' ')}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'nodrag w-full px-2 py-1 text-sm border border-input rounded',
          'bg-background text-foreground',
          'focus:outline-none focus:ring-1 focus:ring-ring'
        )}
      />
    </div>
  );
}

export const TextField = memo(TextFieldComponent);
