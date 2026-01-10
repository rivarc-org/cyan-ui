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
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';

interface ViewModeDropdownProps {
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

export function ViewModeDropdown({
  onLoadRevision,
  onLoadLatest,
}: ViewModeDropdownProps) {
  const viewMode = useUIStore((s) => s.viewMode);
  const revisions = useUIStore((s) => s.revisions);
  const currentRevisionId = useUIStore((s) => s.currentRevisionId);
  const activeRevisionId = useUIStore((s) => s.activeRevisionId);
  const isDirty = useCanvasStore((s) => s.isDirty);

  // Find the revisions for common labels
  const liveRevision = revisions.find(r => r.id === currentRevisionId);
  const historyRevisions = revisions.filter(r => !r.is_draft && r.id !== currentRevisionId);

  const getModeLabel = () => {
    if (isDirty || viewMode === 'draft') return 'Draft';
    if (viewMode === 'live') return liveRevision ? `v${liveRevision.version_number}` : 'Live';
    if (viewMode === 'history') {
      const rev = revisions.find(r => r.id === activeRevisionId);
      return rev ? `v${rev.version_number}` : 'Revision';
    }
    return 'Unknown';
  };

  const getModeIcon = () => {
    if (isDirty || viewMode === 'draft') return <Edit3 className="w-6 h-6 text-orange-500" />;
    return <Radio className="w-6 h-6 text-green-500" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarItem className="gap-2">
          {getModeIcon()}
          <span className="font-medium text-popover-foreground">{getModeLabel()}</span>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </ToolbarItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto">
        {/* Live Option */}
        <DropdownMenuLabel className="text-xs text-gray-500">Live Revision</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onLoadLatest()} className={cn(viewMode === 'live' && !isDirty && 'bg-accent')}>
          <Radio className="w-5 h-5 mr-2 text-green-500" />
          <span>Live</span>
          <span className="ml-auto text-xs text-gray-400">
            {liveRevision ? `v${liveRevision.version_number}` : 'current'}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* History Section */}
        <DropdownMenuLabel className="text-xs text-gray-500">History</DropdownMenuLabel>
        {historyRevisions.length === 0 ? (
          <div className="px-2 py-2 text-sm text-gray-400 italic">No history</div>
        ) : (
          historyRevisions.map((rev) => (
            <DropdownMenuItem
              key={rev.id}
              onClick={() => onLoadRevision(rev.id)}
              className={cn(viewMode === 'history' && activeRevisionId === rev.id && !isDirty && 'bg-accent')}
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
