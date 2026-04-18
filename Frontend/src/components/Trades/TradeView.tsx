import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiService } from "../../services/api";
import { ChartManager } from "../../utils/ChartManager";
import { Card } from "../common/Card";

interface TradeViewProps {
  market: string;
}

export const TradeView = ({ market }: TradeViewProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);

  // Fetch klines data (candlestick data)
  const {
    data: klines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["klines", market],
    queryFn: () => apiService.getKlines(market, "1h", 100),
    enabled: !!market,
  });

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current || klines.length === 0) return;

    // Destroy previous chart if exists
    if (chartManagerRef.current) {
      chartManagerRef.current.destroy();
    }

    // Create new chart
    const chartManager = new ChartManager(
      chartRef.current,
      klines
        .map((kline) => ({
          open: parseFloat(kline.open),
          high: parseFloat(kline.high),
          low: parseFloat(kline.low),
          close: parseFloat(kline.close),
          timestamp: new Date(kline.time),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      {
        background: "#1a1a1a",
        color: "white",
      },
    );

    chartManagerRef.current = chartManager;

    // Cleanup on unmount
    return () => {
      chartManagerRef.current?.destroy();
    };
  }, [klines, market]);

  if (error) {
    return (
      <Card title="Price Chart">
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
          Failed to load chart data
        </div>
      </Card>
    );
  }

  return (
    <Card title="Price Chart">
      {isLoading && (
        <div className="text-gray-400 text-sm py-4">Loading chart...</div>
      )}
      <div
        ref={chartRef}
        style={{
          height: "400px",
          width: "100%",
          display: isLoading ? "none" : "block",
        }}
      />
    </Card>
  );
};
