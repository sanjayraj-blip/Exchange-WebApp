import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/api";
import { Order } from "../types";

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export function useOrders(userId: string, market: string) {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: true,
    error: null,
  });

  const fetchOrders = useCallback(async () => {
    if (!userId || !market) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const orders = await apiService.getOpenOrders(userId, market);
      setState((prev) => ({
        ...prev,
        orders: orders || [],
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [userId, market]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    refetch: fetchOrders,
  };
}
