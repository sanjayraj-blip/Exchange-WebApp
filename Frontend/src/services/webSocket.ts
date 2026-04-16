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
          console.log("Websocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.log("Websocket error", error);
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

  public subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());

      const message = {
        type: "SUBSCRIBE",
        subctription: channel,
      };

      this.send(message);
    }

    this.subscriptions.get(channel)!.add(handler);
  }

  public unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);

        const message = {
          type: "UNSUBCRIBE",
          subcription: channel,
        };

        this.send(message);
      }
    }
  }

  public send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect().catch(console.error);
      }
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.subscriptions.clear();
      this.messageQueue = [];
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      const channel = (message as any).channel || (message as any).subcription;

      if (channel && this.subscriptions.get(channel)) {
        const handlers = this.subscriptions.get(channel)!;

        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (e) {
            console.log("Error in message Handler", e);
          }
        });
      }

      this.subscriptions.forEach((handler) => {
        handler.forEach((handler) => {
          try {
            handler(message);
          } catch (e) {
            console.log("Error in message Handler", e);
          }
        });
      });
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  }

  public flushMessageQueue(): void {
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

export const wsManager = new WebSocketManager();
