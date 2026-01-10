import { useState } from 'react';
import { Plus, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExternalServiceDialog, type ExternalServiceConfig } from '@/components/dialogs/ExternalServiceDialog';
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';

export function AddNodeMenu() {
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const addExternalNode = useCanvasStore((s) => s.addExternalNode);
  const [isExternalDialogOpen, setIsExternalDialogOpen] = useState(false);

  const handleAddExternalService = (config: ExternalServiceConfig) => {
    addExternalNode(config.name, config.image, config.fields);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={openCommandPalette}
        className="rounded-full w-12 h-12 shadow-lg"
        title="Add plugin (Cmd+K)"
      >
        <Plus className="w-5 h-5" />
      </Button>

      <Button
        variant="outline"
        onClick={() => setIsExternalDialogOpen(true)}
        className="rounded-full w-12 h-12 shadow-lg bg-popover"
        title="Add external service"
      >
        <Box className="w-5 h-5" />
      </Button>

      <ExternalServiceDialog
        open={isExternalDialogOpen}
        onOpenChange={setIsExternalDialogOpen}
        onSubmit={handleAddExternalService}
      />
    </div>
  );
}
