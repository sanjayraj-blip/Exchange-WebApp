/*
Why this file?                                                                                            
  The Orderbook only knows how to match orders. The Engine is the coordinator — it:
  1. Receives messages from Redis                                                                           
  2. Calls the right Orderbook method
  3. Updates user balances in memory
  4. Sends responses back to API
  5. Pushes trade data to DB queue
  6. Publishes real-time updates to WebSocket
*/

/*
  Redis queue "messages"
          │
          ▼
     process()  ← switch on message type
          │
          ├── CREATE_ORDER
          │     ├── checkAndLockFunds()
          │     ├── orderbook.addOrder()
          │     ├── updateBalance()
          │     ├── createDbTrades()     → Redis queue "db_processor"
          │     ├── updateDbOrders()     → Redis queue "db_processor"
          │     ├── publisWsDepthUpdates() → Redis pubsub "depth@market"
          │     ├── publishWsTrades()    → Redis pubsub "trade@market"
          │     └── sendToApi()         → Redis pubsub "{clientId}"
          │
          ├── CANCEL_ORDER → cancelBid/cancelAsk → sendToApi
          ├── GET_OPEN_ORDERS → getOpenOrders → sendToApi
          ├── GET_DEPTH → getDepth → sendToApi
          └── ON_RAMP → onRamp (no response needed)
*/

import fs from "fs";
import { RedisManager } from "../RedisManager.js";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  type MessageFromApi,
} from "../types/fromApi.js";
import { ORDER_UPDATE, TRADE_ADDED } from "../types/toDb.js";
import { Orderbook, type Fill, type Order } from "./Orderbook.js";

export const BASE_CURRENCY = "INR";

interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();

  constructor() {
    let snapshot = null;
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("No snapshot found");
    }

    if (snapshot) {
      const parsed = JSON.parse(snapshot.toString());
      this.orderbooks = parsed.orderbooks.map(
        (o: any) =>
          new Orderbook(
            o.baseAsset,
            o.bids,
            o.asks,
            o.lastTradeId,
            o.currentPrice,
          ),
      );
      /*
        Engine.balances is a map of userId → their money:
                                                                                    
        "user1" → {                                                                
            INR:  { available: 10000, locked: 0 },                                 
            TATA: { available: 500,   locked: 0 }                                  
        }

        "user2" → {
            INR:  { available: 50000, locked: 2000 },
            TATA: { available: 100,   locked: 50 }
        }

        ---
        Why two assets (INR and TATA)?

        Because this is a trading exchange. Users hold two things:
        - INR — the money they use to buy stocks
        - TATA — the stock they hold and can sell

        When user1 buys TATA with INR:
        INR  available: 10000 → 8000   (spent 2000)
        TATA available: 500   → 510    (received 10 units)

        ---
        In short:

        balances = a ledger tracking how much INR and TATA every user owns inside
        the exchange.
      */
      this.balances = new Map(parsed.balances);
    } else {
      this.orderbooks = [new Orderbook("TATA", [], [], 0, 0)];
      this.setBaseBalances();
    }

    setInterval(() => {
      this.saveSnapShot();
    }, 1000 * 3);
  }

  /*
   Engine running
       │
       ├── every 3 seconds → saveSnapshot() → writes to snapshot.json
       │
  Engine crashes & restarts
       │
       └── constructor reads snapshot.json → restores exact state

  Think of it like a auto-save in a video game
  */
  saveSnapShot() {
    const snapShot = {
      orderbooks: this.orderbooks.map((o) => o.getSnapShot()),
      balances: Array.from(this.balances.entries()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapShot));
  }

  /*
    This is just a switch statement — 5 cases, one per message type. Each case calls a specific method and
  sends the result back to the API via clientId.
  */
  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.market,
            message.data.price,
            message.data.quantity,
            message.data.side,
            message.data.userId,
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: { orderId, executedQty, fills },
          });
        } catch (e) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: { orderId: "", executedQty: 0, remainingQty: 0 },
          });
        }
        break;

      case CANCEL_ORDER:
        try {
          const orderId = message.data.orderId;
          const cancelMarket = message.data.market;
          const baseAsset = cancelMarket.split("_")[0]!;
          const cancelOrderbook = this.orderbooks.find(
            (o) => o.ticker() === cancelMarket,
          );
          if (!cancelOrderbook) {
            throw new Error("No order Book Found");
          }

          const order =
            cancelOrderbook.asks.find((o) => o.orderId === orderId) ||
            cancelOrderbook.bids.find((o) => o.orderId === orderId);
          if (!order) {
            throw new Error("No order Found");
          }

          /*
           You placed a buy order:
          - Want to buy 10 TATA at price 100 INR
          - When order was placed → 1000 INR was locked (10 × 100)
          - 3 units got filled already
          - You cancel now → 7 units remaining

          const leftQuantity = (order.quantity - order.filled) * order.price;
          //                   (10 - 3) * 100 = 700 INR

          this.balances.get(order.userId)![BASE_CURRENCY].available += 700;  // refund 700 INR
          this.balances.get(order.userId)![BASE_CURRENCY].locked   -= 700;  // release from locked
          */

          if (order.side === "buy") {
            const price = cancelOrderbook.cancelBid(order);
            const leftQuantity = (order.quantity - order.filled) * order.price;
            this.balances.get(order.userId)![BASE_CURRENCY]!.available +=
              leftQuantity;
            this.balances.get(order.userId)![BASE_CURRENCY]!.locked -=
              leftQuantity;
            if (price) this.sendUpdatedDepthAt(price.toString(), cancelMarket);
          } else {
            const price = cancelOrderbook.cancelAsk(order);
            const leftQuantity = order.quantity - order.filled;
            this.balances.get(order.userId)![baseAsset]!.available +=
              leftQuantity;
            this.balances.get(order.userId)![baseAsset]!.locked -=
              leftQuantity;
            if (price) this.sendUpdatedDepthAt(price.toString(), cancelMarket);
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: { orderId, executedQty: 0, remainingQty: 0 },
          });
        } catch (e) {
          console.log("Error while cancelling order", e);
        }
        break;

      case GET_OPEN_ORDERS:
        try {
          const openOrderbook = this.orderbooks.find(
            (o) => o.ticker() === message.data.market,
          );
          if (!openOrderbook) {
            throw new Error("No OrderBook found");
          }
          const openOrders = openOrderbook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (e) {
          console.log(e);
        }
        break;

      case ON_RAMP:
        this.onRamp(message.data.userId, Number(message.data.amount));
        break;

      case GET_DEPTH:
        try {
          const orderbook = this.orderbooks.find(
            (o) => o.ticker() === message.data.market,
          );
          if (!orderbook) throw new Error("No orderbook found");
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth(),
          });
        } catch (e) {
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: { bids: [], asks: [] },
          });
        }
        break;
    }
  }

  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string,
  ) {
    const orderBook = this.orderbooks.find((O) => O.ticker() === market);
    if (!orderBook) {
      throw new Error("OrderBook not found");
    }
    const baseAsset = market.split("_")[0]!;
    const quoteAsset = market.split("_")[1]!;

    // before placing order, check if the user has the enough funds to lock
    this.checkAndLockFunds(
      baseAsset, // TATA
      quoteAsset, //INR
      side,
      userId,
      price,
      quantity,
    );

    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      filled: 0,
      side,
      userId,
    };

    const { fills, executedQty } = orderBook.addOrder(order);

    /*
    After matching, update both users' balances:
    - Buyer gets TATA, loses INR
    - Seller gets INR, loses TATA
    */
    this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);

    this.createDbTrades(fills, market, userId); // save trades to DB
    this.updateDbOrders(order, executedQty, fills, market); // save order to DB
    this.publisWsDepthUpdates(fills, price, side, market); // update orderbook UI
    this.publishWsTrades(fills, userId, market); // broadcast trade feed

    return { executedQty, fills, orderId: order.orderId };
  }

  checkAndLockFunds(
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    userId: string,
    price: string,
    quantity: string,
  ) {
    if (side == "buy") {
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) <
        +quantity * +price
      ) {
        throw new Error("Insufficient balance");
      }
      this.balances.get(userId)![quoteAsset]!.available -=
        Number(quantity) * Number(price);
      this.balances.get(userId)![quoteAsset]!.locked +=
        Number(quantity) * Number(price);
    } else {
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        throw new Error("Insufficient funds");
      }
      this.balances.get(userId)![baseAsset]!.available -= Number(quantity);
      this.balances.get(userId)![baseAsset]!.locked += Number(quantity);
    }
  }

  updateBalance(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    _executedQty: number,
  ) {
    if (side === "buy") {
      //user-1 buy from user-2
      fills.forEach((fill) => {
        //user-2 gets money
        this.balances.get(fill.otheruserId)![quoteAsset]!.available +=
          fill.qty * Number(fill.price);

        // user-2 stock quantity locked should go down
        this.balances.get(fill.otheruserId)![baseAsset]!.locked -= fill.qty;

        // buyer (user1) locked INR is released, gets TATA
        this.balances.get(userId)![quoteAsset]!.locked -=
          fill.qty * Number(fill.price);

        // user1.TATA.available += 6  -> buyer receives TATA
        this.balances.get(userId)![baseAsset]!.available += fill.qty;
      });
    } else {
      // user-1 needs to sell quantity-10, for price-amt
      // buyers locked-bal should go down
      fills.forEach((fill) => {
        this.balances.get(fill.otheruserId)![quoteAsset]!.locked -=
          fill.qty * Number(fill.price);

        this.balances.get(userId)![quoteAsset]!.available +=
          fill.qty * Number(fill.price);

        // buyer (user2) receives TATA
        this.balances.get(fill.otheruserId)![baseAsset]!.available += fill.qty;

        // seller's locked TATA is released
        this.balances.get(userId)![baseAsset]!.locked -= fill.qty;
      });
    }
  }

  /*
    It works the same for both sides:                                            
                                                                               
    If user1 is SELLING:
    - Part 1 → updates user1's sell order status
    - Part 2 → loops through fills → updates each buyer's order that was sitting
    in bids

    Seller user1's order → Part 1 updates it
    Buyer user2's order (was in bids) → Part 2 updates it via fill.markerOrderId
    Buyer user3's order (was in bids) → Part 2 updates it via fill.markerOrderId

    ---
    The key is fill.markerOrderId:

    markerOrderId = the order that was already sitting in the book waiting.

    - Buy order comes in → the waiting orders are asks (sellers) → markerOrderId
    points to sellers
    - Sell order comes in → the waiting orders are bids (buyers) → markerOrderId
    points to buyers

    So Part 2 always updates whoever was on the other side, regardless of buy or
    sell.
  */

  // Sends order status updates to the database queue after a trade happens.
  //updateDbOrders │ the order status — filled, partial, complete
  updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string,
  ) {
    RedisManager.getInstance().pushMessage({
      type: ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        executedQty,
        market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: ORDER_UPDATE,
        data: {
          orderId: fill.marketOrderId,
          executedQty: fill.qty,
        },
      });
    });
  }

  // Records every trade that happened into the database — the permanent history
  //of all transactions on the exchange.
  //createDbTrades │ the trade itself — price, qty, timestamp
  createDbTrades(fills: Fill[], market: string, userId: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: TRADE_ADDED,
        data: {
          market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otheruserId !== userId,
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }

  //createDbTrades = save to database permanently. publishWsTrades = shout to
  //everyone watching right now.

  publishWsTrades(fills: Fill[], userId: string, market: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otheruserId !== userId,
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }

  /*
  Trade 6 (all) → send ["990", "0"] → frontend removes the row
  Trade 5 (partial) → send ["990", "1"] → frontend updates the quantity

   Why called "depth"?

  It shows how "deep" the market is — how much buying/selling interest exists
  at each price level.

  - Shallow depth = very few orders, small trades will move the price a lot
  - Deep depth = lots of orders, large trades won't move the price much
  */
  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) return;
    const depth = orderbook.getDepth();
    const updatedBids = depth.bids.filter((x) => x[0] === price);
    const updatedAsks = depth.asks.filter((x) => x[0] === price);
    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"] as [string, string]],
        b: updatedBids.length ? updatedBids : [[price, "0"] as [string, string]],
        e: "depth",
      },
    });
  }

  publisWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string,
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) return;
    const depth = orderbook.getDepth();

    if (side === "buy") {
      // find ask levels that were consumed by this buy order
      const updatedAsks = fills.map((fill) => {
        const ask = depth.asks.find((x) => x[0] === fill.price);
        return ask ?? [fill.price, "0"] as [string, string]; // if not found, it was fully consumed
      });
      // find the buyer's remaining order in bids (if partially filled)
      const updatedBid = depth.bids.find((x) => x[0] === price);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    }

    if (side === "sell") {
      // find bid levels that were consumed by this sell order
      const updatedBids = fills.map((fill) => {
        const bid = depth.bids.find((x) => x[0] === fill.price);
        return bid ?? [fill.price, "0"] as [string, string]; // if not found, it was fully consumed
      });
      // find the seller's remaining order in asks (if partially filled)
      const updatedAsk = depth.asks.find((x) => x[0] === price);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk ? [updatedAsk] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }

  onRamp(userId: string, amount: number) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: { available: amount, locked: 0 },
      });
    } else {
      userBalance[BASE_CURRENCY]!.available += amount;
    }
  }

  setBaseBalances() {
    this.balances.set("1", {
      [BASE_CURRENCY]: { available: 10000000, locked: 0 },
      TATA: { available: 10000000, locked: 0 },
    });
    this.balances.set("2", {
      [BASE_CURRENCY]: { available: 10000000, locked: 0 },
      TATA: { available: 10000000, locked: 0 },
    });
    this.balances.set("5", {
      [BASE_CURRENCY]: { available: 10000000, locked: 0 },
      TATA: { available: 10000000, locked: 0 },
    });
  }
}
