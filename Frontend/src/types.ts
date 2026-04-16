export interface OrderLevel {
  price: string;
  quantity: string;
}

export interface Depth {
  bids: OrderLevel[];
  asks: OrderLevel[];
}

export interface DepthUpdate {
  type: "DEPTH";
  payload: {
    bids: [string, string][];
    asks: [string, string][];
  };
}

export interface Order {
  orderId: string;
  market: string;
  price: string;
  quantity: string;
  executedQty: string;
  remainingQty: string;
  side: "buy" | "sell";
  status: "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
  timestamp: string;
}

export interface CreateOrderRequest {
  market: string;
  price: string;
  quantity: string;
  side: "buy" | "sell";
  userId: string;
}

export interface OrderResponse {
  type: "ORDER_PLACED" | "ORDER_CANCELLED";
  payload: {
    orderId: string;
    executedQty: string;
    remainingQty?: string;
    fills?: Array<{
      price: string;
      qty: string;
    }>;
  };
}

export interface Trade {
  id: string;
  market: string;
  price: string;
  quantity: string;
  side: "buy" | "sell";
  timestamp: string;
  buyer: string;
  seller: string;
}

export interface TradeUpdate {
  type: "TRADE";
  payload: Trade;
}

export interface Ticker {
  symbol: string;
  lastPrice: string;
  high24h: string;
  low24h: string;
  volume: string;
  change: string;
  changePercent: string;
}

export interface Kline {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface ApiResponse<T> {
  type: string;
  payload?: T;
}

export type WebSocketMessage =
  | DepthUpdate
  | TradeUpdate
  | { type: string; payload: any };
