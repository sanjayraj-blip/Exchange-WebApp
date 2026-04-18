import { useTrades } from "../../hooks/useTrades";
import { Card } from "../common/Card";

interface RecentTradesProps {
  market: string;
}

export const RecentTrades = ({ market }: RecentTradesProps) => {
  const { trades, loading, error, isLive } = useTrades(market);

  if (loading) {
    return (
      <Card title="Recent Trades">
        <div className="text-gray-400">Loading...</div>
      </Card>
    );
  }

  return (
    <Card title="Recent Trades">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded mb-2">
          {error}
        </div>
      )}
      {!isLive && !loading && (
        <div className="text-yellow-500 text-sm p-2 bg-yellow-900/20 rounded mb-2">
          Waiting for real-time updates...
        </div>
      )}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-exchange-surface">
          <div>Price</div>
          <div>Size</div>
          <div>Side</div>
          <div>Time</div>
        </div>
        {trades.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">No trades yet</div>
        ) : (
          trades.map((trade, index) => {
            const timestamp = new Date(trade.timestamp);
            const timeString = timestamp.toLocaleTimeString();

            return (
              <div
                key={index}
                className={`grid grid-cols-4 gap-2 text-xs py-1 border-b border-gray-800 hover:bg-gray-700/30 transition-colors`}
              >
                <div className="font-semibold">
                  {parseFloat(trade.price).toFixed(2)}
                </div>
                <div className="text-gray-300">
                  {parseFloat(trade.quantity).toFixed(4)}
                </div>
                <div
                  className={
                    trade.side === "buy"
                      ? "text-buy font-semibold"
                      : "text-sell font-semibold"
                  }
                >
                  {trade.side.toUpperCase()}
                </div>
                <div className="text-gray-400">{timeString}</div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
