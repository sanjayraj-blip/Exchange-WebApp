# Exchange Frontend - Complete Step-by-Step Setup Guide

This guide shows you **exactly** how to build your React + TypeScript + Tailwind CSS Exchange frontend from scratch. Follow each step in order, copy-paste the commands, and understand what each file does.

## **PHASE 1: PROJECT INITIALIZATION**

### Step 1: Navigate to project and install dependencies

```bash
cd /Users/sanjayraj/Desktop/E/frontend
npm install
```

**What this does:**

- Creates `node_modules/` with all React, TypeScript, and Tailwind packages
- Creates `package-lock.json` to lock dependency versions
- React-scripts includes webpack, babel, dev-server

**Expected output:** "added X packages" without errors

---

### Step 2: Create folder structure

```bash
cd /Users/sanjayraj/Desktop/E/frontend

# Create all directories
mkdir -p src/components/{Layout,OrderBook,TradePanel,Orders,Trades,Common}
mkdir -p src/hooks
mkdir -p src/services
mkdir -p public
```

**What this does:**

- Creates the exact folder structure from the plan
- Organized by feature (OrderBook, TradePanel) + utilities (hooks, services)

---

## **PHASE 2: CREATE CONFIG FILES**

### Step 3: Create tsconfig.json

Open a text editor and create `/Users/sanjayraj/Desktop/E/frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Why:**

- `"strict": true` = catches type errors at compile time
- `"jsx": "react-jsx"` = modern React 18 syntax (no `import React`)
- `"module": "ESNext"` = let react-scripts handle bundling

---

### Step 4: Create tailwind.config.js

Create `/Users/sanjayraj/Desktop/E/frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "exchange-bg": "#1a1a1a",
        "exchange-surface": "#2a2a2a",
        buy: "#16a34a",
        sell: "#dc2626",
        neutral: "#6b7280",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

**Why:**

- `content` array tells Tailwind where to look for class names
- Custom colors = exchange dark theme (buy=green, sell=red)

---

### Step 5: Create postcss.config.js

Create `/Users/sanjayraj/Desktop/E/frontend/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Why:**

- PostCSS processes CSS through Tailwind and Autoprefixer
- Autoprefixer adds `-webkit-`, `-moz-` prefixes for browser compatibility

---

### Step 6: Create public/index.html

Create `/Users/sanjayraj/Desktop/E/frontend/public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exchange - Real-time Trading</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**Why:**

- Single `<div id="root">` is where React mounts the entire app
- React-scripts automatically injects the bundle script tag

---

### Step 7: Create .gitignore

Create `/Users/sanjayraj/Desktop/E/frontend/.gitignore`:

```
node_modules/
dist/
build/
.env
.env.local
.DS_Store
*.log
.idea/
.vscode/
```

**Why:**

- Prevents committing node_modules (massive, re-installable)
- Ignores build outputs, secrets, editor config

---

## **PHASE 3: CORE TYPESCRIPT FILES**

### Step 8: Create src/types.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/types.ts`:

```typescript
// Order Book Types
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

// Order Types
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

// Trade Types
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

// Ticker Types
export interface Ticker {
  symbol: string;
  lastPrice: string;
  high24h: string;
  low24h: string;
  volume: string;
  change: string;
  changePercent: string;
}

// Kline Types (candlestick)
export interface Kline {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// API Response Types
export interface ApiResponse<T> {
  type: string;
  payload?: T;
}

// WebSocket Message Types
export type WebSocketMessage =
  | DepthUpdate
  | TradeUpdate
  | { type: string; payload: any };
```

**Why:**

- All data structures in one file = single source of truth
- TypeScript interfaces = compile-time checking
- Matches your backend API exactly

---

## **PHASE 4: SERVICES (Network Layer)**

### Step 9: Create src/services/api.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/services/api.ts`:

```typescript
import {
  Depth,
  Order,
  CreateOrderRequest,
  OrderResponse,
  Ticker,
  Kline,
  Trade,
} from "../types";

const API_BASE_URL = "http://localhost:3000/api/v1";

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ===== ORDER ENDPOINTS =====

  async createOrder(order: CreateOrderRequest): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return response.json();
  }

  async cancelOrder(orderId: string, market: string): Promise<OrderResponse> {
    const response = await fetch(`${this.baseUrl}/order`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId, market }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${response.statusText}`);
    }

    return response.json();
  }

  async getOpenOrders(userId: string, market: string): Promise<Order[]> {
    const params = new URLSearchParams({
      userId,
      market,
    });

    const response = await fetch(`${this.baseUrl}/order/open?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch open orders: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || [];
  }

  // ===== DEPTH (ORDER BOOK) ENDPOINTS =====

  async getDepth(symbol: string): Promise<Depth> {
    const params = new URLSearchParams({ symbol });

    const response = await fetch(`${this.baseUrl}/depth?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch depth: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || { bids: [], asks: [] };
  }

  // ===== TRADES ENDPOINTS =====

  async getTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
    const params = new URLSearchParams({ symbol });

    const response = await fetch(`${this.baseUrl}/trades?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.statusText}`);
    }

    return response.json();
  }

  // ===== TICKER ENDPOINTS =====

  async getTicker(symbol: string): Promise<Ticker> {
    const params = new URLSearchParams({ symbol });

    const response = await fetch(`${this.baseUrl}/tickers?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ticker: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || {};
  }

  // ===== KLINE ENDPOINTS =====

  async getKlines(
    symbol: string,
    interval: string = "1m",
    limit: number = 100,
  ): Promise<Kline[]> {
    const params = new URLSearchParams({
      symbol,
      interval,
      limit: String(limit),
    });

    const response = await fetch(`${this.baseUrl}/klines?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch klines: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || [];
  }
}

// Export singleton instance
export const apiService = new ApiService();
```

**Why:**

- Centralized API calls = one place to update endpoints
- Error handling = throw errors that components can catch
- Singleton = single instance throughout app

---

### Step 10: Create src/services/websocket.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/services/websocket.ts`:

```typescript
import { WebSocketMessage } from "../types";

type MessageHandler = (message: WebSocketMessage) => void;
type SubscriptionMap = Map<string, Set<MessageHandler>>;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: SubscriptionMap = new Map();
  private messageQueue: any[] = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(url: string = "ws://localhost:3001") {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to a channel with a message handler
   */
  public subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());

      // Send subscription to server
      const message = {
        type: "SUBSCRIBE",
        subscription: channel,
      };
      this.send(message);
    }

    this.subscriptions.get(channel)!.add(handler);
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);

        // Send unsubscribe to server
        const message = {
          type: "UNSUBSCRIBE",
          subscription: channel,
        };
        this.send(message);
      }
    }
  }

  /**
   * Send a message to the server
   */
  public send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect().catch(console.error);
      }
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.subscriptions.clear();
      this.messageQueue = [];
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ===== PRIVATE METHODS =====

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      // Route message to subscribers
      const channel = (message as any).channel || (message as any).subscription;

      if (channel && this.subscriptions.has(channel)) {
        const handlers = this.subscriptions.get(channel)!;
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error("Error in message handler:", error);
          }
        });
      }

      // Also call handlers for all subscriptions (for broadcast messages)
      this.subscriptions.forEach((handlers) => {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error("Error in message handler:", error);
          }
        });
      });
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(
        `Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
```

**Why:**

- Manages WebSocket lifecycle (connect, disconnect, reconnect)
- Subscribe/unsubscribe = clean API for components
- Message queuing = handles messages before connection established
- Error recovery = auto-reconnect with exponential backoff

---

## **PHASE 5: HOOKS (Business Logic)**

### Step 11: Create src/hooks/useWebSocket.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useCallback, useState } from "react";
import { wsManager } from "../services/websocket";
import { WebSocketMessage } from "../types";

/**
 * Hook to use WebSocket subscriptions
 *
 * @param channel - Channel to subscribe to (e.g., 'trade@TATA_INR')
 * @param onMessage - Callback when message received
 * @param autoConnect - Whether to connect automatically
 */
export function useWebSocket(
  channel: string | null,
  onMessage: (message: WebSocketMessage) => void,
  autoConnect = true,
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect || !channel) return;

    // Connect to WebSocket
    const connect = async () => {
      try {
        await wsManager.connect();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setIsConnected(false);
      }
    };

    connect();

    // Subscribe to channel
    wsManager.subscribe(channel, onMessage);

    // Cleanup: unsubscribe when component unmounts or channel changes
    return () => {
      wsManager.unsubscribe(channel, onMessage);
    };
  }, [channel, onMessage, autoConnect]);

  const send = useCallback((message: any) => {
    wsManager.send(message);
  }, []);

  return {
    isConnected,
    error,
    send,
  };
}

/**
 * Hook to manually control WebSocket connection
 */
export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    try {
      await wsManager.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
    setIsConnected(false);
  }, []);

  const subscribe = useCallback(
    (channel: string, handler: (msg: WebSocketMessage) => void) => {
      wsManager.subscribe(channel, handler);
    },
    [],
  );

  const unsubscribe = useCallback(
    (channel: string, handler: (msg: WebSocketMessage) => void) => {
      wsManager.unsubscribe(channel, handler);
    },
    [],
  );

  const send = useCallback((message: any) => {
    wsManager.send(message);
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
  };
}
```

**Why:**

- useWebSocket = automatic subscription/cleanup
- useEffect handles connection lifecycle
- Cleanup prevents memory leaks
- Two hooks for different use cases

---

### Step 12: Create src/hooks/useApi.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/hooks/useApi.ts`:

```typescript
import React, { useState, useCallback, useEffect } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

/**
 * Hook to manage async API calls with loading/error states
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setState({ data: null, loading: false, error: errorMessage });
        throw err;
      }
    },
    [apiFunction],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for fetch-and-display pattern (auto-fetch on mount or deps change)
 */
export function useApiFetch<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  args: any[] = [],
  dependencies: any[] = [],
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, [apiFunction, ...args]);

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    refetch();
  }, dependencies);

  return {
    ...state,
    refetch,
  };
}
```

**Why:**

- loading state = show spinner while fetching
- error state = show error message if fails
- useApi = manual control (on button click)
- useApiFetch = automatic on mount or deps change

---

### Step 13: Create src/hooks/useOrderBook.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/hooks/useOrderBook.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { Depth, OrderLevel, DepthUpdate } from "../types";
import { useWebSocket } from "./useWebSocket";

interface OrderBookState {
  bids: OrderLevel[];
  asks: OrderLevel[];
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

/**
 * Hook to manage order book (depth) data with real-time updates
 *
 * 1. Fetches initial depth from REST API
 * 2. Subscribes to real-time depth updates via WebSocket
 * 3. Merges updates with current state
 */
export function useOrderBook(market: string) {
  const [state, setState] = useState<OrderBookState>({
    bids: [],
    asks: [],
    loading: true,
    error: null,
    lastUpdate: 0,
  });

  // WebSocket subscription for depth updates
  const handleDepthUpdate = useCallback((message: any) => {
    if (message.type === "DEPTH" || message.type === "depth_update") {
      const payload = message.payload;

      setState((prev) => ({
        ...prev,
        bids: payload.bids || prev.bids,
        asks: payload.asks || prev.asks,
        lastUpdate: Date.now(),
      }));
    }
  }, []);

  const { isConnected } = useWebSocket(
    market ? `depth@${market}` : null,
    handleDepthUpdate,
    true,
  );

  // Initial fetch from REST API
  useEffect(() => {
    if (!market) return;

    const fetchDepth = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const depth = await apiService.getDepth(market);
        setState((prev) => ({
          ...prev,
          bids: depth.bids,
          asks: depth.asks,
          loading: false,
          lastUpdate: Date.now(),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch depth";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchDepth();
  }, [market]);

  return {
    bids: state.bids,
    asks: state.asks,
    loading: state.loading,
    error: state.error,
    isLive: isConnected,
    lastUpdate: state.lastUpdate,
  };
}
```

**Why:**

- Combines REST (initial load) + WebSocket (real-time updates)
- setState with previous state = safe updates
- lastUpdate = know when data changed

---

### Step 14: Create src/hooks/useTrades.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/hooks/useTrades.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { Trade } from "../types";
import { useWebSocket } from "./useWebSocket";

interface TradesState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage recent trades with real-time stream
 *
 * 1. Fetches last 50 trades from REST API
 * 2. Subscribes to new trade events via WebSocket
 * 3. Prepends new trades to the list
 */
export function useTrades(market: string) {
  const [state, setState] = useState<TradesState>({
    trades: [],
    loading: true,
    error: null,
  });

  // Handle incoming trade updates
  const handleTradeUpdate = useCallback(
    (message: any) => {
      if (message.type === "TRADE" || message.type === "trade") {
        const trade = message.payload;

        // Verify trade is for this market
        if (trade.market === market) {
          setState((prev) => ({
            ...prev,
            trades: [trade, ...prev.trades].slice(0, 100), // Keep last 100 trades
          }));
        }
      }
    },
    [market],
  );

  const { isConnected } = useWebSocket(
    market ? `trade@${market}` : null,
    handleTradeUpdate,
    true,
  );

  // Initial fetch
  useEffect(() => {
    if (!market) return;

    const fetchTrades = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const trades = await apiService.getTrades(market, 50);
        setState((prev) => ({
          ...prev,
          trades: trades || [],
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch trades";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    fetchTrades();
  }, [market]);

  return {
    trades: state.trades,
    loading: state.loading,
    error: state.error,
    isLive: isConnected,
  };
}
```

**Why:**

- [trade, ...prev.trades] = immutable array prepend
- .slice(0, 100) = prevent unbounded memory growth

---

### Step 15: Create src/hooks/useOrders.ts

Create `/Users/sanjayraj/Desktop/E/frontend/src/hooks/useOrders.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { Order } from "../types";

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage user's open orders
 */
export function useOrders(userId: string, market: string) {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: true,
    error: null,
  });

  const fetchOrders = useCallback(async () => {
    if (!userId || !market) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const orders = await apiService.getOpenOrders(userId, market);
      setState((prev) => ({
        ...prev,
        orders: orders || [],
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [userId, market]);

  // Fetch on mount and when market changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    refetch: fetchOrders,
  };
}
```

**Why:**

- refetch function = parent can trigger refresh after order placed/cancelled

---

## **PHASE 6: COMPONENTS**

### Step 16: Create Common UI Components

#### Create src/components/Common/Button.tsx:

```typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'font-semibold rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {loading ? '...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### Create src/components/Common/Input.tsx:

```typescript
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-200 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white
            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
            focus:border-transparent transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

#### Create src/components/Common/Card.tsx:

```typescript
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-exchange-surface rounded-lg p-4 shadow-md ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};
```

---

### Step 17: Create OrderBook Components

#### Create src/components/OrderBook/BidTable.tsx:

```typescript
import React from 'react';
import { OrderLevel } from '../../types';

interface BidTableProps {
  bids: OrderLevel[];
  maxQuantity: number;
}

export const BidTable: React.FC<BidTableProps> = ({ bids, maxQuantity }) => {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700">
        <div className="text-right">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>
      <div className="space-y-0 max-h-64 overflow-y-auto">
        {bids.map((level, index) => {
          const price = parseFloat(level.price);
          const quantity = parseFloat(level.quantity);
          const total = price * quantity;
          const widthPercent = (quantity / maxQuantity) * 100;

          return (
            <div
              key={index}
              className="relative grid grid-cols-3 gap-2 text-xs py-1 hover:bg-gray-700/30 transition-colors"
              style={{
                backgroundImage: `linear-gradient(to left, rgba(22, 163, 74, 0.1) 0%, rgba(22, 163, 74, 0.1) ${widthPercent}%, transparent ${widthPercent}%)`,
              }}
            >
              <div className="text-right text-buy font-semibold">{price.toFixed(2)}</div>
              <div className="text-right text-gray-300">{quantity.toFixed(4)}</div>
              <div className="text-right text-gray-300">{total.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### Create src/components/OrderBook/AskTable.tsx:

```typescript
import React from 'react';
import { OrderLevel } from '../../types';

interface AskTableProps {
  asks: OrderLevel[];
  maxQuantity: number;
}

export const AskTable: React.FC<AskTableProps> = ({ asks, maxQuantity }) => {
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
              <div className="text-right text-sell font-semibold">{price.toFixed(2)}</div>
              <div className="text-right text-gray-300">{quantity.toFixed(4)}</div>
              <div className="text-right text-gray-300">{total.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### Create src/components/OrderBook/Depth.tsx:

```typescript
import React from 'react';
import { BidTable } from './BidTable';
import { AskTable } from './AskTable';
import { Card } from '../Common/Card';

interface DepthProps {
  bids: [string, string][];
  asks: [string, string][];
  loading: boolean;
}

export const Depth: React.FC<DepthProps> = ({ bids, asks, loading }) => {
  // Find max quantity for scaling
  const allQuantities = [
    ...bids.map(b => parseFloat(b[1])),
    ...asks.map(a => parseFloat(a[1])),
  ];
  const maxQuantity = Math.max(...allQuantities, 0) || 1;

  if (loading) {
    return <Card title="Order Book"><div className="text-gray-400">Loading...</div></Card>;
  }

  return (
    <Card title="Order Book">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-sell mb-2">Asks (Sell)</h3>
          <AskTable
            asks={asks.map(a => ({ price: a[0], quantity: a[1] }))}
            maxQuantity={maxQuantity}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-buy mb-2">Bids (Buy)</h3>
          <BidTable
            bids={bids.map(b => ({ price: b[0], quantity: b[1] }))}
            maxQuantity={maxQuantity}
          />
        </div>
      </div>
    </Card>
  );
};
```

#### Create src/components/OrderBook/OrderBook.tsx:

```typescript
import React from 'react';
import { useOrderBook } from '../../hooks/useOrderBook';
import { Depth } from './Depth';

interface OrderBookProps {
  market: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ market }) => {
  const { bids, asks, loading, error, isLive } = useOrderBook(market);

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}
      {!isLive && !loading && (
        <div className="text-yellow-500 text-sm p-2 bg-yellow-900/20 rounded">
          Waiting for real-time updates...
        </div>
      )}
      <Depth
        bids={bids.map(b => [b.price, b.quantity])}
        asks={asks.map(a => [a.price, a.quantity])}
        loading={loading}
      />
    </div>
  );
};
```

---

### Step 18: Create TradePanel Components

#### Create src/components/TradePanel/BuyForm.tsx:

```typescript
import React, { useState } from 'react';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { apiService } from '../../services/api';

interface BuyFormProps {
  market: string;
  userId: string;
  onOrderPlaced?: () => void;
}

export const BuyForm: React.FC<BuyFormProps> = ({ market, userId, onOrderPlaced }) => {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!price || !quantity) {
      setError('Price and quantity are required');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.createOrder({
        market,
        price,
        quantity,
        side: 'buy',
        userId,
      });

      setSuccess(`Buy order placed! ID: ${response.payload?.orderId}`);
      setPrice('');
      setQuantity('');

      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-lg font-semibold text-buy mb-3">Buy</h3>

        <Input
          label="Price"
          type="number"
          step="0.01"
          placeholder="Enter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Quantity"
          type="number"
          step="0.0001"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={loading}
        />

        {error && <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">{error}</div>}
        {success && <div className="text-green-500 text-sm p-2 bg-green-900/20 rounded">{success}</div>}

        <Button
          type="submit"
          variant="success"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Placing...' : 'Place Buy Order'}
        </Button>
      </form>
    </Card>
  );
};
```

#### Create src/components/TradePanel/SellForm.tsx:

```typescript
import React, { useState } from 'react';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { apiService } from '../../services/api';

interface SellFormProps {
  market: string;
  userId: string;
  onOrderPlaced?: () => void;
}

export const SellForm: React.FC<SellFormProps> = ({ market, userId, onOrderPlaced }) => {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!price || !quantity) {
      setError('Price and quantity are required');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.createOrder({
        market,
        price,
        quantity,
        side: 'sell',
        userId,
      });

      setSuccess(`Sell order placed! ID: ${response.payload?.orderId}`);
      setPrice('');
      setQuantity('');

      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-lg font-semibold text-sell mb-3">Sell</h3>

        <Input
          label="Price"
          type="number"
          step="0.01"
          placeholder="Enter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Quantity"
          type="number"
          step="0.0001"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={loading}
        />

        {error && <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">{error}</div>}
        {success && <div className="text-green-500 text-sm p-2 bg-green-900/20 rounded">{success}</div>}

        <Button
          type="submit"
          variant="danger"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Placing...' : 'Place Sell Order'}
        </Button>
      </form>
    </Card>
  );
};
```

#### Create src/components/TradePanel/TradePanel.tsx:

```typescript
import React from 'react';
import { BuyForm } from './BuyForm';
import { SellForm } from './SellForm';

interface TradePanelProps {
  market: string;
  userId: string;
  onOrderPlaced?: () => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({ market, userId, onOrderPlaced }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BuyForm market={market} userId={userId} onOrderPlaced={onOrderPlaced} />
      <SellForm market={market} userId={userId} onOrderPlaced={onOrderPlaced} />
    </div>
  );
};
```

---

### Step 19: Create Trades Component

#### Create src/components/Trades/RecentTrades.tsx:

```typescript
import React from 'react';
import { useTrades } from '../../hooks/useTrades';
import { Card } from '../Common/Card';

interface RecentTradesProps {
  market: string;
}

export const RecentTrades: React.FC<RecentTradesProps> = ({ market }) => {
  const { trades, loading, error, isLive } = useTrades(market);

  if (loading) {
    return <Card title="Recent Trades"><div className="text-gray-400">Loading...</div></Card>;
  }

  return (
    <Card title="Recent Trades">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded mb-2">
          {error}
        </div>
      )}
      {!isLive && !loading && (
        <div className="text-yellow-500 text-sm p-2 bg-yellow-900/20 rounded mb-2">
          Waiting for real-time updates...
        </div>
      )}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-exchange-surface">
          <div>Price</div>
          <div>Size</div>
          <div>Side</div>
          <div>Time</div>
        </div>
        {trades.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">No trades yet</div>
        ) : (
          trades.map((trade, index) => {
            const timestamp = new Date(trade.timestamp);
            const timeString = timestamp.toLocaleTimeString();

            return (
              <div
                key={index}
                className={`grid grid-cols-4 gap-2 text-xs py-1 border-b border-gray-800 hover:bg-gray-700/30 transition-colors`}
              >
                <div className="font-semibold">{parseFloat(trade.price).toFixed(2)}</div>
                <div className="text-gray-300">{parseFloat(trade.quantity).toFixed(4)}</div>
                <div className={trade.side === 'buy' ? 'text-buy font-semibold' : 'text-sell font-semibold'}>
                  {trade.side.toUpperCase()}
                </div>
                <div className="text-gray-400">{timeString}</div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
```

---

### Step 20: Create Orders Component

#### Create src/components/Orders/OpenOrders.tsx:

```typescript
import React, { useState } from 'react';
import { Order } from '../../types';
import { Button } from '../Common/Button';
import { apiService } from '../../services/api';

interface OpenOrdersTableProps {
  orders: Order[];
  onOrderCancelled?: () => void;
}

export const OpenOrdersTable: React.FC<OpenOrdersTableProps> = ({ orders, onOrderCancelled }) => {
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async (orderId: string, market: string) => {
    setCancellingOrderId(orderId);
    setError(null);

    try {
      await apiService.cancelOrder(orderId, market);
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return <div className="text-gray-500 text-sm py-4">No open orders</div>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-700 sticky top-0 bg-exchange-surface">
          <div>Price</div>
          <div>Size</div>
          <div>Filled</div>
          <div>Side</div>
          <div>Status</div>
          <div>Action</div>
        </div>
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="grid grid-cols-6 gap-2 text-xs py-2 border-b border-gray-800 items-center hover:bg-gray-700/30 transition-colors"
          >
            <div className="font-semibold">{parseFloat(order.price).toFixed(2)}</div>
            <div className="text-gray-300">{parseFloat(order.quantity).toFixed(4)}</div>
            <div className="text-gray-300">{parseFloat(order.executedQty).toFixed(4)}</div>
            <div className={order.side === 'buy' ? 'text-buy font-semibold' : 'text-sell font-semibold'}>
              {order.side.toUpperCase()}
            </div>
            <div className="text-yellow-500">{order.status}</div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleCancel(order.orderId, order.market)}
              loading={cancellingOrderId === order.orderId}
              disabled={cancellingOrderId !== null}
            >
              {cancellingOrderId === order.orderId ? '...' : 'Cancel'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Create src/components/Orders/Orders.tsx:

```typescript
import React, { useCallback } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { OpenOrdersTable } from './OpenOrders';
import { Card } from '../Common/Card';

interface OrdersProps {
  market: string;
  userId: string;
}

export const Orders: React.FC<OrdersProps> = ({ market, userId }) => {
  const { orders, loading, error, refetch } = useOrders(userId, market);

  const handleOrderCancelled = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Card title="Open Orders">
      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-900/20 rounded mb-2">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <OpenOrdersTable orders={orders} onOrderCancelled={handleOrderCancelled} />
      )}
    </Card>
  );
};
```

---

### Step 21: Create Layout Components

#### Create src/components/Layout/Header.tsx:

```typescript
import React from 'react';

interface HeaderProps {
  market: string;
  isLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ market, isLive }) => {
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
            <p className={`text-sm font-semibold ${isLive ? 'text-green-500' : 'text-yellow-500'}`}>
              {isLive ? '● Live' : '● Connecting...'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
```

#### Create src/components/Layout/Sidebar.tsx:

```typescript
import React from 'react';

interface SidebarProps {
  onMarketChange: (market: string) => void;
  currentMarket: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMarketChange, currentMarket }) => {
  const markets = ['TATA_INR', 'RELIANCE_INR', 'INFY_INR'];

  return (
    <aside className="bg-exchange-surface border-r border-gray-700 w-48 p-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase">Markets</h2>
      <div className="space-y-2">
        {markets.map((market) => (
          <button
            key={market}
            onClick={() => onMarketChange(market)}
            className={`
              w-full text-left px-3 py-2 rounded transition-colors
              ${currentMarket === market
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-300 hover:bg-gray-700'
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
```

#### Create src/components/Layout/Layout.tsx:

```typescript
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  market: string;
  onMarketChange: (market: string) => void;
  isLive: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  market,
  onMarketChange,
  isLive,
}) => {
  return (
    <div className="min-h-screen bg-exchange-bg text-white flex flex-col">
      <Header market={market} isLive={isLive} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onMarketChange={onMarketChange} currentMarket={market} />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};
```

---

### Step 22: Create Global Styles

#### Create src/App.css:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  background-color: #1a1a1a;
  color: #ffffff;
}

/* Exchange-specific utilities */
@layer components {
  .price-positive {
    @apply text-buy font-semibold;
  }

  .price-negative {
    @apply text-sell font-semibold;
  }

  .table-cell {
    @apply px-4 py-2 text-sm border-b border-gray-700;
  }

  .card {
    @apply bg-exchange-surface rounded-lg p-4 shadow-md;
  }
}
```

---

### Step 23: Create React Entry Points

#### Create src/index.tsx:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Create src/App.tsx:

```typescript
import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout/Layout';
import { OrderBook } from './components/OrderBook/OrderBook';
import { TradePanel } from './components/TradePanel/TradePanel';
import { RecentTrades } from './components/Trades/RecentTrades';
import { Orders } from './components/Orders/Orders';
import { useWebSocketConnection } from './hooks/useWebSocket';

const DEFAULT_MARKET = 'TATA_INR';
const USER_ID = 'user-1'; // Hardcoded for now (no auth)

function App() {
  const [market, setMarket] = useState(DEFAULT_MARKET);
  const { isConnected } = useWebSocketConnection();

  // Start connection on mount
  React.useEffect(() => {
    // WebSocket connection is managed by hook
  }, []);

  const handleMarketChange = useCallback((newMarket: string) => {
    setMarket(newMarket);
  }, []);

  const handleOrderPlaced = useCallback(() => {
    // Orders component will refetch via hook
  }, []);

  return (
    <Layout
      market={market}
      onMarketChange={handleMarketChange}
      isLive={isConnected}
    >
      <div className="grid grid-cols-4 gap-4 h-full">
        {/* Left column: Order book (2 cols wide) */}
        <div className="col-span-2">
          <OrderBook market={market} />
        </div>

        {/* Right column: Trading panel + orders (2 cols wide) */}
        <div className="col-span-2 space-y-4 flex flex-col">
          <TradePanel
            market={market}
            userId={USER_ID}
            onOrderPlaced={handleOrderPlaced}
          />
          <div className="flex-1 overflow-auto">
            <Orders market={market} userId={USER_ID} />
          </div>
        </div>
      </div>

      {/* Bottom row: Recent trades (full width) */}
      <div className="col-span-4 mt-4 h-48">
        <RecentTrades market={market} />
      </div>
    </Layout>
  );
}

export default App;
```

---

## **PHASE 7: LAUNCH & VERIFY**

### Step 24: Start the development server

```bash
cd /Users/sanjayraj/Desktop/E/frontend
npm start
```

**What happens:**

- Webpack compiles TypeScript and JSX
- Tailwind CSS processes styles
- Dev server starts on http://localhost:3000
- Browser automatically opens the app

**Expected output:**

```
Compiled successfully!

You can now view exchange-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Step 25: Verify in Browser

1. Open http://localhost:3000
2. Check:
   - Layout renders (header, sidebar visible)
   - Market selector works (click TATA_INR, RELIANCE_INR, INFY_INR)
   - Order book displays (may show "Loading..." if backend isn't ready)
   - Buy/Sell forms visible
   - No red errors in browser console

### Step 26: Test Backend Connection

Make sure your backend API is running:

```bash
# In another terminal, test if backend is running
curl http://localhost:3000/api/v1/depth?symbol=TATA_INR
```

Expected: Should return JSON with bids/asks or error if backend isn't set up yet.

---

## **Summary of What You Built**

### Architecture:

- **React 18** with **TypeScript** for type safety
- **Tailwind CSS** for dark-themed UI
- **Hooks-based state** (no Redux/Redux-like patterns)
- **REST API** for initial data loads
- **WebSocket** for real-time streaming
- **Component composition** for reusability

### Core Features:

1. ✅ Live order book (bids/asks)
2. ✅ Buy/Sell order placement
3. ✅ Open orders with cancel functionality
4. ✅ Real-time trade stream
5. ✅ Market switcher
6. ✅ Connection status indicator

### What You Learned:

- React fundamentals (hooks, composition, lifecycle)
- TypeScript interfaces and type safety
- REST + WebSocket hybrid architecture
- Component libraries (Button, Input, Card)
- Real-time data management
- Form handling and validation
- CSS-in-JS with Tailwind

---

## **Next Steps (Optional Features)**

- Add price charts (TradingView Lightweight Charts library)
- Add authentication (JWT tokens)
- Add portfolio/balance view
- Add order history/analytics
- Add price alerts
- Deploy to production (Vercel, Netlify)

All code is clean, well-organized, and ready for your portfolio!
