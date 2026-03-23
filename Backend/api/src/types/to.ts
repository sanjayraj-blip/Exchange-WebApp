//Why? — Defines every message the API can push into the Redis messages queue (what the engine will receive).
export type MessageToEngine =
  | {
      type: "CREATE_ORDER";
      data: {
        market: string;
        price: string;
        quantity: string;
        side: "buy" | "sell";
        userId: string;
      };
    }
  | {
      type: "CANCEL_ORDER";
      data: {
        orderId: string;
        market: string;
      };
    }
  | {
      type: "ON_RAMP";
      data: {
        amount: string;
        userId: string;
        txnId: string;
      };
    }
  | {
      type: "GET_DEPTH";
      data: {
        market: string;
      };
    }
  | {
      type: "GET_OPEN_ORDERS";
      data: {
        userId: string;
        market: string;
      };
    };
