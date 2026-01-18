import {
  ChevronLeft,
  Undo2,
  Redo2,
  Play,
  Square,
  Loader2,
  Save,
} from 'lucide-react';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { ViewModeDropdown } from '@/components/layout/ViewModeDropdown';
import { UserMenu } from '@/components/layout/UserMenu';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarLabel,
  ToolbarSeparator,
} from '@/components/layout/EditorToolbar';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/useProjectController';
import type { RevisionSummary } from '@/api/types';

interface EditorLeftPanelProps {
  projectId?: string;
  projectName?: string;
  viewMode: ViewMode;
  revisions: RevisionSummary[];
  currentRevisionId: string | null;
  activeRevisionId: string | null;
  isDirty: boolean;
  onBack: () => void;
  onLoadRevision: (revisionId: string) => void;
  onLoadLive: () => void;
  onDeleteDraft: (revisionId: string) => void;
}

interface EditorRightPanelProps {
  viewMode: ViewMode;
  isDirty: boolean;
  isSaving: boolean;
  isDeploying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasValidationErrors?: boolean;
  onSave: () => void;
  onDeploy: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function EditorLeftPanel({
  projectId,
  projectName,
  viewMode,
  revisions,
  currentRevisionId,
  activeRevisionId,
  isDirty,
  onBack,
  onLoadRevision,
  onLoadLive,
  onDeleteDraft,
}: EditorLeftPanelProps) {
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
          viewMode={viewMode}
          revisions={revisions}
          currentRevisionId={currentRevisionId}
          activeRevisionId={activeRevisionId}
          isDirty={isDirty}
          onLoadRevision={onLoadRevision}
          onLoadLive={onLoadLive}
          onDeleteDraft={onDeleteDraft}
        />
      </ToolbarGroup>

      <SettingsDialog projectId={projectId} projectName={projectName} />
    </Toolbar>
  );
}


export function EditorRightPanel({
  viewMode,
  isDirty,
  isSaving,
  isDeploying,
  canUndo,
  canRedo,
  hasValidationErrors = false,
  onSave,
  onDeploy,
  onStop,
  onUndo,
  onRedo,
}: EditorRightPanelProps) {
  const deployDisabled = isDeploying || hasValidationErrors;
  return (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarItem onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
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
          disabled={!isDirty || isSaving}
          title="Save (Cmd+S)"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </ToolbarItem>
      </ToolbarGroup>

      <ToolbarGroup>
        {viewMode === 'live' && !isDirty && onStop ? (
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
            disabled={deployDisabled}
            className={cn(
              !deployDisabled &&
              'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
            )}
            title={hasValidationErrors ? 'Fix validation errors to deploy' : 'Deploy'}
          >
            {isSaving || isDeploying ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </ToolbarItem>
        )}
      </ToolbarGroup>

      <UserMenu />
    </Toolbar>
  );
}
