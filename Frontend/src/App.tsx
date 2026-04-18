import { useCallback, useEffect, useState } from "react";
import { Layout } from "./components/Layout/Layout";
import { OrderBook } from "./components/orderBook/OrderBook";
import { Orders } from "./components/Orders/Orders";
import { TradePanel } from "./components/tradePanel/TradePanel";
import { RecentTrades } from "./components/Trades/RecentTrades";
import { TradeView } from "./components/Trades/TradeView";
import { useWebSocketConnection } from "./hooks/useWebsocket";

const DEFAULT_MARKET = "TATA_INR";
const USER_ID = "user-1";

const App = () => {
  const [market, setMarket] = useState(DEFAULT_MARKET);
  const { isConnected } = useWebSocketConnection();

  useEffect(() => {
    // WebSocket connection managed by hook
  }, []);

  const handleMarketChange = useCallback((newMarket: string) => {
    setMarket(newMarket);
  }, []);

  return (
    <Layout
      market={market}
      onMarketChange={handleMarketChange}
      isLive={isConnected}
    >
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-4">
          <TradeView market={market} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="col-span-2">
          <OrderBook market={market} />
        </div>

        <div className="col-span-2 space-y-4 flex flex-col">
          <TradePanel market={market} userId={USER_ID} />
          <div className="flex-1 overflow-auto">
            <Orders market={market} userId={USER_ID} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        <div className="col-span-4 h-48">
          <RecentTrades market={market} />
        </div>
      </div>
    </Layout>
  );
};

export default App;
