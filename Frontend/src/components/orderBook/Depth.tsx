import { Card } from "../common/Card";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";

interface DepthProps {
  bids: [string, string][];
  asks: [string, string][];
  loading: boolean;
}

export const Depth = ({ bids, asks, loading }: DepthProps) => {
  // Find max quantity for scaling
  const allQuantities = [
    ...bids.map((b) => parseFloat(b[1])),
    ...asks.map((a) => parseFloat(a[1])),
  ];
  const maxQuantity = Math.max(...allQuantities, 0) || 1;

  if (loading) {
    return (
      <Card title="Order Book">
        <div className="text-gray-400">Loading...</div>
      </Card>
    );
  }

  return (
    <Card title="Order Book">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-sell mb-2">Asks (Sell)</h3>
          <AskTable
            asks={asks.map((a) => ({ price: a[0], quantity: a[1] }))}
            maxQuantity={maxQuantity}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-buy mb-2">Bids (Buy)</h3>
          <BidTable
            bids={bids.map((b) => ({ price: b[0], quantity: b[1] }))}
            maxQuantity={maxQuantity}
          />
        </div>
      </div>
    </Card>
  );
};
