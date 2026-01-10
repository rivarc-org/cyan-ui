import { useState, useCallback } from 'react';
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Save,
  Play,
  Square,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ViewModeDropdown } from '@/components/layout/ViewModeDropdown';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/store/canvasStore';
import { flowToBackend } from '@/lib/transformers';
import { useUIStore } from '@/store/uiStore';

interface FloatingBarProps {
  projectId: string;
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
  onLoadRevision: (revisionId: string) => Promise<void>;
  onLoadLatest: () => Promise<void>;
}



export function EditorLeftPanel({
  projectId,
  projectName,
  isDirty,
  onLoadRevision,
  onLoadLatest,
  onBack,
}: Pick<FloatingBarProps, 'projectId' | 'projectName' | 'isDirty' | 'onLoadRevision' | 'onLoadLatest' | 'onBack'>) {
  const viewMode = useUIStore((s) => s.viewMode);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const nodes = useCanvasStore.getState().nodes;
    const edges = useCanvasStore.getState().edges;
    const graphState = flowToBackend(nodes, edges);

    await navigator.clipboard.writeText(JSON.stringify(graphState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="bg-popover/90 shadow-sm hover:bg-accent hover:text-accent-foreground backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      {/* Project Name */}
      <div className="bg-popover/90 shadow-sm rounded-md px-4 py-2 flex items-center gap-2 backdrop-blur-sm border border-border/50">
        <span className="font-medium text-sm text-popover-foreground">{projectName}</span>
      </div>

      {/* View Mode Dropdown */}
      <ViewModeDropdown
        projectId={projectId}
        isDirty={isDirty}
        onLoadRevision={onLoadRevision}
        onLoadLatest={onLoadLatest}
      />

      {/* Copy JSON Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="bg-popover/90 shadow-sm hover:bg-accent hover:text-accent-foreground backdrop-blur-sm"
        title="Copy graph JSON to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}

export function EditorRightPanel({
  isDirty,
  isSaving,
  isDeploying,
  canUndo,
  canRedo,
  onSave,
  onDeploy,
  onStop,
  onUndo,
  onRedo,
}: Omit<FloatingBarProps, 'projectId' | 'projectName' | 'onBack' | 'onLoadRevision' | 'onLoadLatest'>) {

  return (
    <div className="flex items-center gap-4">
      {/* Actions */}
      <div className="bg-popover/90 shadow-sm rounded-md flex items-center backdrop-blur-sm border border-border/50">
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
          className="rounded-none border-l border-border hover:bg-accent hover:text-accent-foreground"
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
          className="rounded-none border-l border-border hover:bg-accent hover:text-accent-foreground"
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
            className="rounded-l-none border-l border-border text-destructive hover:bg-destructive/10"
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
              'rounded-l-none border-l border-border hover:bg-accent hover:text-accent-foreground',
              !isDeploying && 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
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
