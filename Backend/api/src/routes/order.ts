/*
Why this file?                                                                                                      
  This handles all order-related HTTP endpoints. It receives the request from the browser, calls sendAndAwait to talk 
  to the engine, and returns the response. 
*/

/*
 POST /order
  browser sends:  { market: "TATA_INR", price: "1000", quantity: "5", side: "buy", userId: "1" }
  engine returns: { type: "ORDER_PLACED", payload: { orderId, executedQty, fills } }

  DELETE /order
  browser sends:  { orderId: "abc123", market: "TATA_INR" }
  engine returns: { type: "ORDER_CANCELLED", payload: { orderId, executedQty, remainingQty } }

  GET /order/open?userId=1&market=TATA_INR
  engine returns: { type: "OPEN_ORDERS", payload: [ ...orders ] }
*/

import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types/from";

export const orderRouter = Router();

orderRouter.post("/", async (req, res) => {
  const { market, price, quantity, side, userId } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    data: { market, price, quantity, side, userId },
  });

  res.json(response);
});

orderRouter.delete("/", async (req, res) => {
  const { orderId, market } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CANCEL_ORDER,
    data: { orderId, market },
  });

  res.json(response);
});

orderRouter.get("/open", async (req, res) => {
  const { userId, market } = req.query;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    data: {
      userId: userId as string,
      market: market as string,
    },
  });

  res.json(response);
});
