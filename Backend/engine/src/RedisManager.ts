import { createClient, type RedisClientType } from "redis";
import type { MessageToApi } from "./types/toApi.js";
import type { MessageToDb } from "./types/toDb.js";
import type { WsMessage } from "./types/toWs.js";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public sendToApi(clientId: string, message: MessageToApi) {
    this.client.publish(clientId, JSON.stringify(message));
  }
  public pushMessage(message: MessageToDb) {
    this.client.lPush("db_processor", JSON.stringify(message));
  }
  public publishMessage(channel: string, message: WsMessage) {
    this.client.publish(channel, JSON.stringify(message));
  }
}
