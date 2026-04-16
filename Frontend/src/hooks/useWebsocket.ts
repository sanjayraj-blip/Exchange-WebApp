import { useCallback, useEffect, useState } from "react";
import { WebSocketManager, wsManager } from "../services/webSocket";
import { WebSocketMessage } from "../types";

export function useWebSocket(
  channel: string | null,
  onMessage: (message: WebSocketManager) => void,
  autoConnect = true,
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect || !channel) return;

    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed");
        setIsConnected(false);
      }
    };

    connect();

    wsManager.subscribe(channel, onMessage);

    return () => {
      wsManager.unsubscribe(channel, onMessage);
    };
  }, [channel, onMessage, autoConnect]);

  const send = useCallback((message: any) => {
    wsManager.send(message);
  }, []);

  return {
    isConnected,
    error,
    send,
  };
}

export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      await wsManager.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
    setIsConnected(false);
  }, []);

  const subscribe = useCallback(
    (channel: string, handler: (msg: WebSocketMessage) => void) => {
      wsManager.subscribe(channel, handler);
    },
    [],
  );

  const unsubscribe = useCallback(
    (channel: string, handler: (msg: WebSocketMessage) => void) => {
      wsManager.unsubscribe(channel, handler);
    },
    [],
  );

  const send = useCallback((message: any) => {
    wsManager.send(message);
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
  };
}
