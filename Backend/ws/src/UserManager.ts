/*
 Why this file?                                                                                                      
  When a new browser connects, we need to create a User instance and store it. When they disconnect, we remove it.    
  SubscriptionManager calls UserManager.getUser(userId) to find the right WebSocket connection to send messages to.   
  This is the registry of all active connections. 
*/

/*

 Why UserManager is needed by SubscriptionManager

  Notice this line in SubscriptionManager:
  const user = UserManager.getInstance().getUser(userId);
  user?.emit(parsedMessage);

  SubscriptionManager only stores user IDs (strings), not the
  actual User objects. So when Redis fires a message, it needs
  to go to UserManager and say "give me the User object for
  this ID" — then it can call .emit() on it to send the
  WebSocket message.

  ---
  One-line summary of each

  - User — "I am one browser tab. I listen and I speak."
  - UserManager — "I know where all users are. Ask me by ID."
  - SubscriptionManager — "I know who wants what. When Redis
  has news, I deliver it."

*/

import { WebSocket } from "ws";
import { User } from "./User";

export class UserManager {
  private users: Map<string, User> = new Map();
  private static instance: UserManager;

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const user = new User(id, ws);
    this.users.set(id, user);
    return user;
  }

  public getUser(id: string) {
    return this.users.get(id);
  }

  public removeUser(id: string) {
    this.users.delete(id);
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
