/*
 Why this file?                                                                                                      
  This returns the current state of the orderbook — all bids and asks grouped by price level. The frontend uses this  
  to draw the orderbook UI (the list of buy/sell prices and quantities). 

That's it — one endpoint, one purpose.

  What the response looks like:

  {
    "type": "DEPTH",
    "payload": {
      "bids": [
        ["1000", "15"],
        ["999",  "8"],
        ["998",  "20"]
      ],
      "asks": [
        ["1001", "10"],
        ["1002", "5"],
        ["1003", "25"]
      ]
    }
  }
*/

import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH } from "../types/from";

export const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
  const { symbol } = req.query;

  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_DEPTH,
    data: { market: symbol as string },
  });

  res.json(response);
});
