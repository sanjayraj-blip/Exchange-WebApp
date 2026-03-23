import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
  const user = UserManager.getInstance().addUser(ws);
  console.log("New user connected");
});

console.log("WebSocket server running on port 3001");
