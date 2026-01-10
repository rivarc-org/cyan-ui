import { useState, useCallback } from 'react';
import {
  ChevronLeft,
  Undo2,
  Redo2,
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
import { useUIStore } from '@/store/uiStore';
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
  onDeploy: () => void;
  onStop?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onLoadRevision: (revisionId: string) => Promise<void>;
  onLoadLatest: () => Promise<void>;
  currentRevisionId?: string;
}



export function EditorLeftPanel({
  onLoadRevision,
  onLoadLatest,
  onBack,
}: Pick<FloatingBarProps, 'onLoadRevision' | 'onLoadLatest' | 'onBack'>) {
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
        <ToolbarLabel>{useUIStore(s => s.projectName)}</ToolbarLabel>
        <ToolbarSeparator />
        <ViewModeDropdown
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
  onDeploy,
  onStop,
  onUndo,
  onRedo,
}: Omit<FloatingBarProps, 'projectId' | 'projectName' | 'onBack' | 'onLoadRevision' | 'onLoadLatest' | 'onSave'>) {

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
        {useUIStore.getState().viewMode === 'live' && !isDirty && onStop ? (
          <ToolbarItem
            onClick={onStop}
            disabled={isDeploying}
            className="text-destructive hover:bg-destructive/10"
            title="Stop deployment"
          >
            {isDeploying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Square className="w-6 h-6" />
            )}
          </ToolbarItem>
        ) : (
          <ToolbarItem
            onClick={onDeploy}
            disabled={isDeploying}
            className={cn(
              !isDeploying && 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
            )}
            title="Deploy (Cmd+S)"
          >
            {isSaving || isDeploying ? (
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
