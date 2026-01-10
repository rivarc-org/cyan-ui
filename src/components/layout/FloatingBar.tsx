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
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ViewModeDropdown } from '@/components/layout/ViewModeDropdown';
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarLabel, ToolbarSeparator } from '@/components/layout/EditorToolbar';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/store/canvasStore';
import { flowToBackend } from '@/lib/transformers';


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
    <Toolbar>
      <ToolbarGroup>
        <ToolbarItem onClick={onBack} title="Back to dashboard">
          <ChevronLeft className="w-6 h-6 mr-1" />
          Back
        </ToolbarItem>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarLabel>{projectName}</ToolbarLabel>
        <ToolbarSeparator />
        <ViewModeDropdown
          projectId={projectId}
          isDirty={isDirty}
          onLoadRevision={onLoadRevision}
          onLoadLatest={onLoadLatest}
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarItem onClick={handleCopy} title="Copy graph JSON to clipboard">
          {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
        </ToolbarItem>
      </ToolbarGroup>

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </Toolbar>
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
    <Toolbar>
      <ToolbarGroup>
        <ToolbarItem
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-6 h-6" />
        </ToolbarItem>
        <ToolbarSeparator />
        <ToolbarItem
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-6 h-6" />
        </ToolbarItem>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarItem
          onClick={onSave}
          disabled={isSaving || !isDirty}
          title="Save (Cmd+S)"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </ToolbarItem>
        <ToolbarSeparator />
        {isDeploying && onStop ? (
          <ToolbarItem
            onClick={onStop}
            className="text-destructive hover:bg-destructive/10"
            title="Stop deployment"
          >
            <Square className="w-6 h-6" />
          </ToolbarItem>
        ) : (
          <ToolbarItem
            onClick={onDeploy}
            disabled={isDeploying}
            className={cn(
              !isDeploying && 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
            )}
            title="Deploy"
          >
            {isDeploying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </ToolbarItem>
        )}
      </ToolbarGroup>
    </Toolbar>
  );
}
