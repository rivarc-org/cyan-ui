import { useCallback, useRef } from 'react';
import type { Terminal } from '@xterm/xterm';
import { useWebSocket } from './useWebSocket';

export function useContainerLogs(
  projectId: string,
  nodeId: string | null,
  terminal: Terminal | null
) {
  const terminalRef = useRef(terminal);
  terminalRef.current = terminal;

  const handleMessage = useCallback((data: string) => {
    if (terminalRef.current && typeof data === 'string') {
      terminalRef.current.write(data);
    }
  }, []);

  return useWebSocket<string>({
    url: `/api/v1/projects/${projectId}/containers/${nodeId}/logs`,
    onMessage: handleMessage,
    enabled: !!nodeId && !!terminal,
  });
}
