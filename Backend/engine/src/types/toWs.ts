//Why? — Defines the real-time messages the engine publishes to Redis pubsub channels (trade@market, depth@market). The
//  WS server subscribes to these and forwards them to browsers.

export type TickerUpdateMessage = {
  stream: string;
  data: {
    c?: string; //current price
    h?: string; //high price in last 24h
    l?: string; //low price in last 24h
    v?: string; // volume (base asset) — how many TATA traded
    V?: string; //quote volume (quote asset) — how many INR traded
    s?: string; // symbol / market name
    id: number; // message id / sequence number
    e: "ticker";
  };
};

export type DepthUpdateMessage = {
  stream: string;
  data: {
    b?: [string, string][];
    a?: [string, string][];
    e: "depth";
  };
};

export type TradeAddedMessage = {
  stream: string;
  data: {
    e: "trade";
    t: number; // tradeId
    m: boolean; // isBuyerMaker
    p: string; // price
    q: string; // quantity
    s: string; // symbol/market
  };
};

export type WsMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | TradeAddedMessage;
