import { useOrders } from "../../hooks/useOrders";
import { Card } from "../common/Card";
import { OpenOrdersTable } from "./OpenOrders";

interface OrdersProps {
  market: string;
  userId: string;
}

export const Orders = ({ market, userId }: OrdersProps) => {
  const { orders, loading, error } = useOrders(userId, market);

  return (
    <Card title="Open Orders">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded mb-2">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <OpenOrdersTable orders={orders} userId={userId} market={market} />
      )}
    </Card>
  );
};
