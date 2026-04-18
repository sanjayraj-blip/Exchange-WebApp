import { BuyForm } from "./BuyForm";
import { SellForm } from "./SellForm";

interface TradePanelProps {
  market: string;
  userId: string;
}

export const TradePanel = ({ market, userId }: TradePanelProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BuyForm market={market} userId={userId} />
      <SellForm market={market} userId={userId} />
    </div>
  );
};
