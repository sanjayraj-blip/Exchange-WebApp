import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { Order } from "../../types";
import { Button } from "../common/Buttom";

interface OpenOrdersTableProps {
  orders: Order[];
  userId: string;
  market: string;
}

export const OpenOrdersTable = ({
  orders,
  userId,
  market,
}: OpenOrdersTableProps) => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (params: { orderId: string; market: string }) =>
      apiService.cancelOrder(params.orderId, params.market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", userId, market] });
    },
  });

  const handleCancel = (orderId: string, orderMarket: string) => {
    mutate({ orderId, market: orderMarket });
  };

  if (orders.length === 0) {
    return <div className="text-gray-500 text-sm py-4">No open orders</div>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
          {error instanceof Error ? error.message : "Failed to cancel order"}
        </div>
      )}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-exchange-surface">
          <div>Price</div>
          <div>Size</div>
          <div>Filled</div>
          <div>Side</div>
          <div>Status</div>
          <div>Action</div>
        </div>
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="grid grid-cols-6 gap-2 text-xs py-2 border-b border-gray-800 items-center hover:bg-gray-700/30 transition-colors"
          >
            <div className="font-semibold">
              {parseFloat(order.price).toFixed(2)}
            </div>
            <div className="text-gray-300">
              {parseFloat(order.quantity).toFixed(4)}
            </div>
            <div className="text-gray-300">
              {parseFloat(order.executedQty).toFixed(4)}
            </div>
            <div
              className={
                order.side === "buy"
                  ? "text-buy font-semibold"
                  : "text-sell font-semibold"
              }
            >
              {order.side.toUpperCase()}
            </div>
            <div className="text-yellow-500">{order.status}</div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleCancel(order.orderId, order.market)}
              loading={isPending}
              disabled={isPending}
            >
              {isPending ? "..." : "Cancel"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
