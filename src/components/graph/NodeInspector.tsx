import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/stores/uiStore';
import { useGraphStore } from '@/stores/graphStore';
import { useContainerLogs } from '@/hooks/useContainerLogs';

export function NodeInspector() {
  const { id: projectId } = useParams<{ id: string }>();
  const isOpen = useUIStore((s) => s.isInspectorOpen);
  const closeInspector = useUIStore((s) => s.closeInspector);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  // Initialize terminal when logs tab is active
  useEffect(() => {
    if (isOpen && terminalRef.current && !terminalInstanceRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1a1a1a',
          foreground: '#ffffff',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      // Delay fit to ensure container has dimensions
      setTimeout(() => fitAddon.fit(), 0);

      terminalInstanceRef.current = term;

      return () => {
        term.dispose();
        terminalInstanceRef.current = null;
      };
    }
  }, [isOpen]);

  // Connect to logs WebSocket
  useContainerLogs(
    projectId || '',
    selectedNodeId,
    terminalInstanceRef.current
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeInspector();
    }
  };

  if (!selectedNode) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>No node selected</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{selectedNode.data.pluginName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4 flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1">
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4 overflow-y-auto pr-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Node ID
              </h4>
              <p className="text-sm font-mono">{selectedNode.id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Plugin ID
              </h4>
              <p className="text-sm font-mono">{selectedNode.data.pluginId}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Category
              </h4>
              <p className="text-sm capitalize">{selectedNode.data.category}</p>
            </div>
            {selectedNode.data.exports.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Exports
                </h4>
                <ul className="text-sm space-y-1 mt-1">
                  {selectedNode.data.exports.map((exp) => (
                    <li key={exp.key} className="font-mono text-xs">
                      <span className="text-blue-600">{exp.key}</span>:{' '}
                      <span className="text-muted-foreground">{exp.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4 flex-1 min-h-0">
            <div
              ref={terminalRef}
              className="h-full w-full rounded-md overflow-hidden bg-[#1a1a1a]"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
