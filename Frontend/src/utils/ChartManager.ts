import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: Date;
}

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private chart: any;

  constructor(
    ref: HTMLDivElement,
    initialData: CandleData[],
    layout: { background: string; color: string },
  ) {
    // Create chart with dark theme
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: layout.color,
      },
    });

    this.chart = chart;
    this.candleSeries = chart.addCandlestickSeries();

    // Set initial candle data
    this.candleSeries.setData(
      initialData.map((data) => ({
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        time: Math.floor(data.timestamp.getTime() / 1000) as UTCTimestamp,
      })),
    );

    // Auto-fit chart to content
    chart.timeScale().fitContent();
  }

  // Update current candle with latest price
  public update(candleData: CandleData) {
    this.candleSeries.update({
      open: candleData.open,
      high: candleData.high,
      low: candleData.low,
      close: candleData.close,
      time: Math.floor(candleData.timestamp.getTime() / 1000) as UTCTimestamp,
    });
  }

  // Clean up chart on unmount
  public destroy() {
    this.chart.remove();
  }
}
