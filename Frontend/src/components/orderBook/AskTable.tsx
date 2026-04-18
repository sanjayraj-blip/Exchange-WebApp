import { OrderLevel } from "../../types";

interface AskTableProps {
  asks: OrderLevel[];
  maxQuantity: number;
}

export const AskTable = ({ asks, maxQuantity }: AskTableProps) => {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700">
        <div className="text-right">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>
      <div className="space-y-0 max-h-64 overflow-y-auto">
        {asks.map((level, index) => {
          const price = parseFloat(level.price);
          const quantity = parseFloat(level.quantity);
          const total = price * quantity;
          const widthPercent = (quantity / maxQuantity) * 100;

          return (
            <div
              key={index}
              className="relative grid grid-cols-3 gap-2 text-xs py-1 hover:bg-gray-700/30 transition-colors"
              style={{
                backgroundImage: `linear-gradient(to left, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.1) ${widthPercent}%, transparent ${widthPercent}%)`,
              }}
            >
              <div className="text-right text-sell font-semibold">
                {price.toFixed(2)}
              </div>
              <div className="text-right text-gray-300">
                {quantity.toFixed(4)}
              </div>
              <div className="text-right text-gray-300">{total.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
