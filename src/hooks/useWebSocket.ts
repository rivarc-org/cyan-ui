import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useWebSocket<T = unknown>({
  url,
  onMessage,
  onError,
  onClose,
  enabled = true,
}: UseWebSocketOptions<T>) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const fullUrl = `${protocol}//${window.location.host}${url}`;

    const ws = new WebSocket(fullUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        onMessage(data);
      } catch {
        // Handle non-JSON messages (like raw log text)
        onMessage(event.data as T);
      }
    };

    ws.onerror = (event) => {
      onError?.(event);
    };

    ws.onclose = () => {
      setIsConnected(false);
      onClose?.();
    };

    wsRef.current = ws;
  }, [url, onMessage, onError, onClose, enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { isConnected, disconnect };
}
