/*
 The API needs to send a message to the engine AND wait for the response before replying to the browser. This is the 
  sendAndAwait pattern — it sends to the Redis queue, then blocks until the engine publishes back on the clientId
  channel.                                                                                                            
                  
  This needs two Redis clients — one to subscribe (listen), one to publish (send). You can't use the same client for
  both in Redis.
*/

import { createClient, RedisClientType } from "redis";
import { MessageFromOrderbook } from "./types/from";
import { MessageToEngine } from "./types/to";

export class RedisManager {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
    this.publisher = createClient();
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public sendAndAwait(message: MessageToEngine) {
    return new Promise<MessageFromOrderbook>((resolve) => {
      const id = this.getRandomClientId();
      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resolve(JSON.parse(message));
      });
      this.publisher.lPush(
        "messages",
        JSON.stringify({ clientId: id, message }),
      );
    });
  }

  public getRandomClientId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
