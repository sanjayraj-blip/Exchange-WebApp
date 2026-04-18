interface SidebarProps {
  onMarketChange: (market: string) => void;
  currentMarket: string;
}

export const Sidebar = ({ onMarketChange, currentMarket }: SidebarProps) => {
  const markets = ["TATA_INR", "RELIANCE_INR", "INFY_INR"];

  return (
    <aside className="bg-exchange-surface border-r border-gray-700 w-48 p-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase">
        Markets
      </h2>
      <div className="space-y-2">
        {markets.map((market) => (
          <button
            key={market}
            onClick={() => onMarketChange(market)}
            className={`
              w-full text-left px-3 py-2 rounded transition-colors
              ${
                currentMarket === market
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-700"
              }
            `}
          >
            {market}
          </button>
        ))}
      </div>
    </aside>
  );
};
