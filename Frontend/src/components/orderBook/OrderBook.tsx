import { useOrderBook } from "../../hooks/useOrderBook";
import { Depth } from "./Depth";

interface OrderBookProps {
  market: string;
}

export const OrderBook = ({ market }: OrderBookProps) => {
  const { bids, asks, loading, error, isLive } = useOrderBook(market);

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}
      {!isLive && !loading && (
        <div className="text-yellow-500 text-sm p-2 bg-yellow-900/20 rounded">
          Waiting for real-time updates...
        </div>
      )}
      <Depth
        bids={bids.map((b) => [b.price, b.quantity])}
        asks={asks.map((a) => [a.price, a.quantity])}
        loading={loading}
      />
    </div>
  );
};
