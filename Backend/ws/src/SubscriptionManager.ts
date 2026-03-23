/*
Here's the full picture:

  Browser (user) <--WebSocket--> WS Server <--Redis Pub/Sub--> Exchange Engine

  - Exchange Engine publishes live price updates to Redis channels like trade@TATA_INR
  - WS Server subscribes to those Redis channels and forwards updates to users
  - The browser sends messages like "I want trade@TATA_INR" → that's a SUBSCRIBE

*/

import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  private client: RedisClientType;
  private static instance: SubscriptionManager;

  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(subscription)) {
      this.subscriptions.get(subscription)?.push(userId);
    } else {
      this.subscriptions.set(subscription, [userId]);
      this.client.subscribe(subscription, this.redisCallbackHandler);
    }

    if (this.reverseSubscriptions.get(userId)) {
      this.reverseSubscriptions.get(userId)?.push(subscription);
    } else {
      this.reverseSubscriptions.set(userId, [subscription]);
    }
  }

  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(subscription);
    if (subscriptions) {
      this.subscriptions.set(
        subscription,
        subscriptions.filter((s) => s !== userId),
      );
    }
    if (this.subscriptions.get(subscription)?.length === 0) {
      this.subscriptions.delete(subscription);
      this.client.unsubscribe(subscription);
    }

    const reverseSubscriptions = this.reverseSubscriptions.get(userId);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(
        userId,
        reverseSubscriptions.filter((s) => s !== subscription),
      );
      if (this.reverseSubscriptions.get(userId)?.length === 0) {
        this.reverseSubscriptions.delete(userId);
      }
    }
  }

  public userLeft(userId: string) {
    const userSubscriptions = this.reverseSubscriptions.get(userId) || [];
    userSubscriptions.forEach((subscription) => {
      this.unsubscribe(userId, subscription);
    });
  }
  private redisCallbackHandler = (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    // find all users subscribed to this channel and send them the message
    this.subscriptions.get(channel)?.forEach((userId) => {
      const user = UserManager.getInstance().getUser(userId);
      user?.emit(parsedMessage);
    });
  };
}
