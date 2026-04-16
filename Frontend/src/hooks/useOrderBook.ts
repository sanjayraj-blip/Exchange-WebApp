import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/api";
import { OrderLevel } from "../types";
import { useWebSocket } from "./useWebsocket";

interface OrderBookState {
  bids: OrderLevel[];
  asks: OrderLevel[];
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

export function useOrderBook(market: string) {
  const [state, setState] = useState<OrderBookState>({
    bids: [],
    asks: [],
    loading: true,
    error: null,
    lastUpdate: 0,
  });

  const handleDepthUpdate = useCallback((message: any) => {
    if (message.type === "DEPTH" || message.type === "depth_update") {
      const payload = message.payload;

      setState((prev) => ({
        ...prev,
        bids: payload.bids || prev.bids,
        asks: payload.asks || prev.asks,
        lastUpdate: Date.now(),
      }));
    }
  }, []);

  const { isConnected } = useWebSocket(
    market ? `depth@${market}` : null,
    handleDepthUpdate,
    true,
  );

  useEffect(() => {
    if (!market) return;

    const fetchDepth = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const depth = await apiService.getDepth(market);
        setState((prev) => ({
          ...prev,
          bids: depth.bids,
          asks: depth.asks,
          loading: false,
          lastUpdate: Date.now(),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch depth";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchDepth();
  }, [market]);

  return {
    bids: state.bids,
    asks: state.asks,
    loading: state.loading,
    error: state.error,
    isLive: isConnected,
    lastUpdate: state.lastUpdate,
  };
}
