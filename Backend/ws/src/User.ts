import { WebSocket } from "ws";
import { SubscriptionManager } from "./SubscriptionManager";
import { IncomingMessage } from "./types/in";
import { OutgoingMessage } from "./types/out";

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListener();
  }

  private addListener() {
    this.ws.on("message", (message: string) => {
      const parsedMessage: IncomingMessage = JSON.parse(message);

      if (parsedMessage.method === "SUBSCRIBE") {
        parsedMessage.params.forEach((subs) => {
          SubscriptionManager.getInstance().subscribe(this.id, subs);
        });
      }

      if (parsedMessage.method === "UNSUBSCRIBE") {
        parsedMessage.params.forEach((subscription) => {
          SubscriptionManager.getInstance().unsubscribe(this.id, subscription);
        });
      }
    });

    this.ws.on("close", () => {
      SubscriptionManager.getInstance().userLeft(this.id);
    });
  }

  public emit(message: OutgoingMessage) {
    this.ws.send(JSON.stringify(message));
  }
}
