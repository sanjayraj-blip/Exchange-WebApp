/*
 The WebSocket server needs to know two things:
  - What messages come IN from the browser (subscribe/unsubscribe to streams)                                         
  - What messages go OUT to the browser (trade, depth, ticker updates)
*/

/*
params is an array of stream names the browser wants to subscribe to:
  ["trade@TATA_INR", "depth@TATA_INR"]
*/

export type SubscribeMessage = {
  method: "SUBSCRIBE";
  params: string[];
};

export type UnsubscribeMessage = {
  method: "UNSUBSCRIBE";
  params: string[];
};

export type IncomingMessage = SubscribeMessage | UnsubscribeMessage;
