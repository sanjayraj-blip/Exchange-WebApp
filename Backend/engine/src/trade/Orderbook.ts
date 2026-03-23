// Why this file?
//  This is the core of the entire exchange. It holds two lists — bids (buy orders) and asks (sell orders) — and matches
//  them against each other. When a buy price >= a sell price, a trade happens. No Redis, no Express, no DB — pure
// matching logic.

//  Think of this as a single row in an order form. When a user places an order it looks like:
//  price:    1000      ← I want to buy at this price
// quantity: 10        ← I want 10 units
// orderId:  "abc123"  ← unique ID for this order
// filled:   0         ← how much has been matched so far (starts at 0)
// side:     "buy"     ← buy or sell
// userId:   "1"       ← who placed this order

export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  filled: number;
  side: "buy" | "sell";
  userId: string;
}

//A Fill is created when two orders match — one trade happened. Example:

// price:        "1000"   ← the price the trade happened at
// qty:          5        ← how many units traded
// tradeId:      42       ← unique ID for this trade
// otherUserId:  "2"      ← the person on the other side
// markerOrderId: "xyz"   ← the order ID that was already sitting in the book

export interface Fill {
  price: string;
  qty: number;
  tradeId: number;
  otheruserId: string;
  marketOrderId: string;
}

export class Orderbook {
  bids: Order[];
  asks: Order[];
  baseAsset: string;
  quoteAsset: string = "INR";
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string, // "TATA"
    bids: Order[], // existing buy orders (empty at start)
    asks: Order[], //existing sell orders (empty at start)
    lastTradeId: number, // last trade number (0 at start)
    currentPrice: number, // last traded price (0 at start)
  ) {
    this.bids = bids;
    this.asks = asks;
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  getSnapShot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }

  addOrder(order: Order): { executedQty: number; fills: Fill[] } {
    if (order.side === "buy") {
      const { executedQty, fills } = this.matchBid(order);
      order.filled = executedQty;
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      this.bids.push(order);
      return { executedQty, fills };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      order.filled = executedQty;
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      this.asks.push(order);
      return { executedQty, fills };
    }
  }

  // I wanna buy at order.price , match this bids to asks
  matchBid(order: Order): { executedQty: number; fills: Fill[] } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.asks.length; i++) {
      const ask = this.asks[i];
      if (!ask) continue;
      if (ask.price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(order.quantity - executedQty, ask.quantity);
        executedQty += filledQty;
        ask.filled += filledQty;
        fills.push({
          price: ask.price.toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otheruserId: ask.userId,
          marketOrderId: ask.orderId,
        });
      }
    }

    for (let i = 0; i < this.asks.length; i++) {
      const ask = this.asks[i];
      if (ask && ask.filled === ask.quantity) {
        this.asks.splice(i, 1);
        i--;
      }
    }

    return { fills, executedQty };
  }

  // I wanna sell at order.price, match this asks(means sell) to bids
  matchAsk(order: Order): { executedQty: number; fills: Fill[] } {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i];
      if (!bid) continue;
      if (bid.price >= order.price && executedQty < order.quantity) {
        const remainingQty = Math.min(
          order.quantity - executedQty,
          bid.quantity,
        );
        executedQty += remainingQty;
        bid.filled += remainingQty;
        fills.push({
          price: bid.price.toString(),
          qty: remainingQty,
          tradeId: this.lastTradeId++,
          otheruserId: bid.userId,
          marketOrderId: bid.orderId,
        });
      }
    }

    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i];
      if (bid && bid.filled === bid.quantity) {
        this.bids.splice(i, 1);
        i--;
      }
    }

    return { fills, executedQty };
  }

  //When the API receives a GET_DEPTH message, it calls this method and sends
  //the result back to the frontend so the user can see:
  //- What prices people are willing to buy at
  //- What prices people are willing to sell at
  // - How much quantity is available at each price

  //Without this, the frontend has no idea what the current market looks like.

  getDepth() {
    const bidsObj: { [key: string]: number } = {};
    const asksObj: { [key: string]: number } = {};

    for (const order of this.bids) {
      if (!bidsObj[order.price]) {
        bidsObj[order.price] = 0;
      }
      bidsObj[order.price] = (bidsObj[order.price] ?? 0) + order.quantity;
    }

    for (const order of this.asks) {
      if (!asksObj[order.price]) {
        asksObj[order.price] = 0;
      }
      asksObj[order.price] = (asksObj[order.price] ?? 0) + order.quantity;
    }

    return {
      bids: Object.entries(bidsObj).map(([price, qty]) => [price, qty.toString()]) as [string, string][],
      asks: Object.entries(asksObj).map(([price, qty]) => [price, qty.toString()]) as [string, string][],
    };
  }

  // When a user opens their trading dashboard, they see a list of their pending
  // orders — orders that are still sitting in the book waiting to be matched.
  // This method powers that screen.

  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter((o) => o.orderId === userId);
    const bids = this.bids.filter((o) => o.orderId === userId);

    return [...asks, ...bids];
  }

  cancelAsk(order: Order) {
    const index = this.asks.findIndex((o) => o.orderId === order.orderId);
    if (index !== -1) {
      const ask = this.asks[index];
      if (!ask) return;
      const price = ask.price;
      this.asks.splice(index, 1);
      return price;
    }
  }

  cancelBid(order: Order) {
    const index = this.bids.findIndex((o) => o.orderId === order.orderId);
    if (index !== -1) {
      const bid = this.bids[index];
      if (!bid) {
        return;
      }
      const price = bid.price;
      this.bids.splice(index, 1);
      return price;
    }
  }
}
