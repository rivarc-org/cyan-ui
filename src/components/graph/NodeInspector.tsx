import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useContainerLogs } from '@/hooks/useContainerLogs';

export function NodeInspector() {
  const { id: projectId } = useParams<{ id: string }>();
  const isOpen = useUIStore((s) => s.isInspectorOpen);
  const closeInspector = useUIStore((s) => s.closeInspector);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);

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
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>No node selected</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{selectedNode.data.pluginName}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1">
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
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
                Image
              </h4>
              <p className="text-sm font-mono">{selectedNode.data.image}</p>
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

          <TabsContent value="logs" className="mt-4">
            <div
              ref={terminalRef}
              className="h-[400px] rounded-md overflow-hidden bg-[#1a1a1a]"
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
