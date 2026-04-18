interface HeaderProps {
  market: string;
  isLive: boolean;
}

export const Header = ({ market, isLive }: HeaderProps) => {
  return (
    <header className="bg-exchange-surface border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Exchange</h1>
          <p className="text-sm text-gray-400">Real-time Trading Platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-semibold">{market}</p>
            <p
              className={`text-sm font-semibold ${isLive ? "text-green-500" : "text-yellow-500"}`}
            >
              {isLive ? "● Live" : "● Connecting..."}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
