import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Trade } from "../types";
import { useWebSocket } from "./useWebsocket";

interface TradesState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage recent trades with real-time stream
 *
 * 1. Fetches last 50 trades from REST API
 * 2. Subscribes to new trade events via WebSocket
 * 3. Prepends new trades to the list
 */
export function useTrades(market: string) {
  const [state, setState] = useState<TradesState>({
    trades: [],
    loading: true,
    error: null,
  });

  // Handle incoming trade updates
  const handleTradeUpdate = useCallback(
    (message: any) => {
      if (message.type === "TRADE" || message.type === "trade") {
        const trade = message.payload;

        // Verify trade is for this market
        if (trade.market === market) {
          setState((prev) => ({
            ...prev,
            trades: [trade, ...prev.trades].slice(0, 100), // Keep last 100 trades
          }));
        }
      }
    },
    [market],
  );

  const { isConnected } = useWebSocket(
    market ? `trade@${market}` : null,
    handleTradeUpdate,
    true,
  );

  // Initial fetch
  useEffect(() => {
    if (!market) return;

    const fetchTrades = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const trades = await apiService.getTrades(market, 50);
        setState((prev) => ({
          ...prev,
          trades: trades || [],
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch trades";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchTrades();
  }, [market]);

  return {
    trades: state.trades,
    loading: state.loading,
    error: state.error,
    isLive: isConnected,
  };
}
