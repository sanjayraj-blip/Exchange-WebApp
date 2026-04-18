import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  market: string;
  onMarketChange: (market: string) => void;
  isLive: boolean;
}

export const Layout = ({
  children,
  market,
  onMarketChange,
  isLive,
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-exchange-bg text-white flex flex-col">
      <Header market={market} isLive={isLive} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onMarketChange={onMarketChange} currentMarket={market} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
};
