import { ChevronDown, Radio, Edit3, History } from 'lucide-react';
import { ToolbarItem } from '@/components/layout/EditorToolbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/useProjectController';
import type { RevisionSummary } from '@/api/types';

interface ViewModeDropdownProps {
  viewMode: ViewMode;
  revisions: RevisionSummary[];
  currentRevisionId: string | null;
  activeRevisionId: string | null;
  isDirty: boolean;
  onLoadRevision: (revisionId: string) => void;
  onLoadLive: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ViewModeDropdown({
  viewMode,
  revisions,
  currentRevisionId,
  activeRevisionId,
  isDirty,
  onLoadRevision,
  onLoadLive,
}: ViewModeDropdownProps) {
  // Categorize revisions
  const liveRevision = revisions.find((r) => r.id === currentRevisionId);
  const draftRevisions = revisions.filter((r) => r.is_draft);
  const historyRevisions = revisions.filter(
    (r) => !r.is_draft && r.id !== currentRevisionId
  );

  // Find the currently active revision for labeling
  const activeRevision = revisions.find((r) => r.id === activeRevisionId);

  const getModeLabel = () => {
    if (isDirty) return 'Draft (unsaved)';
    if (viewMode === 'draft' && activeRevision) {
      return `Draft v${activeRevision.version_number}`;
    }
    if (viewMode === 'draft') return 'Draft';
    if (viewMode === 'live') {
      return liveRevision ? `Live v${liveRevision.version_number}` : 'Live';
    }
    if (viewMode === 'history' && activeRevision) {
      return `v${activeRevision.version_number}`;
    }
    return 'Unknown';
  };

  const getModeIcon = () => {
    if (isDirty || viewMode === 'draft') {
      return <Edit3 className="w-6 h-6 text-orange-500" />;
    }
    return <Radio className="w-6 h-6 text-green-500" />;
  };

  const isActive = (revisionId: string) => {
    return activeRevisionId === revisionId && !isDirty;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarItem className="gap-2">
          {getModeIcon()}
          <span className="font-medium text-popover-foreground">
            {getModeLabel()}
          </span>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </ToolbarItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 max-h-[80vh] overflow-y-auto"
      >
        {/* Live Option */}
        <DropdownMenuLabel className="text-xs text-gray-500">
          Live Revision
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onLoadLive()}
          className={cn(viewMode === 'live' && !isDirty && 'bg-accent')}
        >
          <Radio className="w-5 h-5 mr-2 text-green-500" />
          <span>Live</span>
          <span className="ml-auto text-xs text-gray-400">
            {liveRevision ? `v${liveRevision.version_number}` : 'current'}
          </span>
        </DropdownMenuItem>

        {/* Drafts Section */}
        {draftRevisions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">
              Drafts
            </DropdownMenuLabel>
            {draftRevisions.map((rev) => (
              <DropdownMenuItem
                key={rev.id}
                onClick={() => onLoadRevision(rev.id)}
                className={cn(isActive(rev.id) && 'bg-accent')}
              >
                <Edit3 className="w-5 h-5 mr-2 text-orange-500" />
                <span>v{rev.version_number}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {formatDate(rev.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* History Section */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-gray-500">
          History
        </DropdownMenuLabel>
        {historyRevisions.length === 0 ? (
          <div className="px-2 py-2 text-sm text-gray-400 italic">
            No history
          </div>
        ) : (
          historyRevisions.map((rev) => (
            <DropdownMenuItem
              key={rev.id}
              onClick={() => onLoadRevision(rev.id)}
              className={cn(isActive(rev.id) && 'bg-accent')}
            >
              <History className="w-5 h-5 mr-2 text-gray-400" />
              <span>v{rev.version_number}</span>
              <span className="ml-auto text-xs text-gray-400">
                {formatDate(rev.created_at)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
