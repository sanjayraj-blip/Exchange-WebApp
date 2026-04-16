import {
  CreateOrderRequest,
  Depth,
  Kline,
  Order,
  OrderResponse,
  Ticker,
  Trade,
} from "../types";

const API_BASE_URL = "http://localhost:3000/api/v1";

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

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

export const apiService = new ApiService();
