import {
  ChevronLeft,
  Undo2,
  Redo2,
  Save,
  Play,
  Square,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingBarProps {
  projectName: string;
  isDirty: boolean;
  isSaving: boolean;
  isDeploying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onSave: () => void;
  onDeploy: () => void;
  onStop?: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function FloatingBar({
  projectName,
  isDirty,
  isSaving,
  isDeploying,
  canUndo,
  canRedo,
  onBack,
  onSave,
  onDeploy,
  onStop,
  onUndo,
  onRedo,
}: FloatingBarProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="bg-white/90 shadow-sm hover:bg-white"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      {/* Project Name + Dirty Indicator */}
      <div className="bg-white/90 shadow-sm rounded-md px-4 py-2 flex items-center gap-2">
        <span className="font-medium text-sm">{projectName}</span>
        {isDirty && (
          <span className="w-2 h-2 rounded-full bg-orange-400" title="Unsaved changes" />
        )}
      </div>

      {/* Actions */}
      <div className="bg-white/90 shadow-sm rounded-md flex items-center">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-r-none"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-none border-l"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        {/* Save */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="rounded-none border-l"
          title="Save (Cmd+S)"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </Button>

        {/* Deploy/Stop */}
        {isDeploying && onStop ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="rounded-l-none border-l text-destructive"
            title="Stop deployment"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeploy}
            disabled={isDeploying}
            className={cn(
              'rounded-l-none border-l',
              !isDeploying && 'text-green-600 hover:text-green-700'
            )}
            title="Deploy"
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
