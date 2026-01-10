import { useState } from 'react';
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
import { useUIStore, type ViewMode } from '@/store/uiStore';
import { revisionsApi } from '@/api/revisions';
import type { RevisionSummary } from '@/api/types';
import { cn } from '@/lib/utils';

interface ViewModeDropdownProps {
  projectId: string;
  isDirty: boolean;
  onLoadRevision: (revisionId: string) => Promise<void>;
  onLoadLatest: () => Promise<void>;
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

function getModeLabel(mode: ViewMode, isDirty: boolean): string {
  if (mode.type === 'live') {
    return isDirty ? 'Draft' : 'Live';
  }
  if (mode.type === 'draft') {
    return 'Draft';
  }
  return `v${mode.versionNumber}`;
}

function getModeIcon(mode: ViewMode, isDirty: boolean) {
  if (mode.type === 'live' && !isDirty) {
    return <Radio className="w-4 h-4 text-green-500" />;
  }
  if (mode.type === 'draft' || isDirty) {
    return <Edit3 className="w-4 h-4 text-orange-500" />;
  }
  return <History className="w-4 h-4 text-gray-500" />;
}

export function ViewModeDropdown({
  projectId,
  isDirty,
  onLoadRevision,
  onLoadLatest,
}: ViewModeDropdownProps) {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const enterLiveMode = useUIStore((s) => s.enterLiveMode);
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load revisions when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    if (open && projectId) {
      setIsLoading(true);
      try {
        const list = await revisionsApi.list(projectId);
        setRevisions(list);
      } catch (err) {
        console.error('Failed to load revisions:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectLive = async () => {
    await onLoadLatest();
    enterLiveMode();
  };

  const handleSelectRevision = async (rev: RevisionSummary) => {
    await onLoadRevision(rev.id);
    setViewMode({
      type: 'revision',
      revisionId: rev.id,
      versionNumber: rev.version_number,
    });
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <ToolbarItem className="gap-2">
          {getModeIcon(viewMode, isDirty)}
          <span className="font-medium text-popover-foreground">{getModeLabel(viewMode, isDirty)}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </ToolbarItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleSelectLive}>
          <Radio className="w-4 h-4 mr-2 text-green-500" />
          <span>Live</span>
          {viewMode.type === 'live' && !isDirty && (
            <span className="ml-auto text-xs text-gray-400">current</span>
          )}
        </DropdownMenuItem>

        {isDirty && (
          <DropdownMenuItem disabled>
            <Edit3 className="w-4 h-4 mr-2 text-orange-500" />
            <span>Draft</span>
            <span className="ml-auto text-xs text-gray-400">unsaved</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-gray-500">
          History
        </DropdownMenuLabel>

        {isLoading ? (
          <div className="px-2 py-4 text-center text-sm text-gray-400">
            Loading...
          </div>
        ) : revisions.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-400">
            No revisions yet
          </div>
        ) : (
          revisions.slice(0, 10).map((rev) => (
            <DropdownMenuItem
              key={rev.id}
              onClick={() => handleSelectRevision(rev)}
              className={cn(
                viewMode.type === 'revision' &&
                viewMode.revisionId === rev.id &&
                'bg-accent'
              )}
            >
              <History className="w-4 h-4 mr-2 text-gray-400" />
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
