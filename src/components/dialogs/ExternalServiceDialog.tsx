import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExternalInputField } from '@/types/graph';

interface ExternalServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (config: ExternalServiceConfig) => void;
}

export interface ExternalServiceConfig {
  name: string;
  image: string;
  fields: ExternalInputField[];
}

interface FieldDraft {
  id: string;
  name: string;
  type: 'text' | 'secret';
  value: string;
}

function generateId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ExternalServiceDialog({
  open,
  onOpenChange,
  onSubmit,
}: ExternalServiceDialogProps) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [fields, setFields] = useState<FieldDraft[]>([]);

  const handleAddField = () => {
    setFields([...fields, { id: generateId(), name: '', type: 'text', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, key: keyof FieldDraft, value: string) => {
    setFields(
      fields.map((field, i) =>
        i === index ? { ...field, [key]: value } : field
      )
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const config: ExternalServiceConfig = {
      name: name.trim(),
      image: image.trim() || `${name.toLowerCase().replace(/\s+/g, '-')}:latest`,
      fields: fields
        .filter((f) => f.name.trim())
        .map((f) => ({
          id: f.name.toLowerCase().replace(/\s+/g, '_'),
          name: f.name.trim(),
          type: f.type,
          value: f.value,
        })),
    };

    onSubmit(config);
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setName('');
    setImage('');
    setFields([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add External Service</DialogTitle>
          <DialogDescription>
            Define a custom external service with your own configuration fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., External Database"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-image">Docker Image (optional)</Label>
            <Input
              id="service-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="e.g., postgres:15"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Configuration Fields</Label>
              <Button size="sm" variant="outline" onClick={handleAddField}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fields yet. Click "Add Field" to add configuration options.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) =>
                          handleUpdateField(index, 'name', e.target.value)
                        }
                      />
                    </div>
                    <Select
                      value={field.type}
                      onValueChange={(v: string) =>
                        handleUpdateField(index, 'type', v as 'text' | 'secret')
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="secret">Secret</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex-1">
                      <Input
                        placeholder="Default value"
                        value={field.value}
                        onChange={(e) =>
                          handleUpdateField(index, 'value', e.target.value)
                        }
                        type={field.type === 'secret' ? 'password' : 'text'}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveField(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
