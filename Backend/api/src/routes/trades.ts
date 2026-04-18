/*
 Why this file?                                                                                                      
  Recent trades (the trade history feed) come from TimescaleDB — not the engine. Once a trade is matched, the engine  
  pushes it to the db_processor queue, the DB service writes it to the database, and from then on the API reads it    
  directly from DB. No need to go through the engine for historical data.    
*/

/*
 The frontend (browser) calls this when a user opens a trading page:
  1. Page loads → fetch last 50 trades → display in the "Recent Trades"
  panel
  2. After that, new trades usually come via WebSocket (live stream), not
   this REST endpoint
*/

import { Router } from "express";
import { Client } from "pg";

export const tradesRouter = Router();

const pgClient = new Client({
  host: "localhost",
  port: 5433,
  database: "exchange_db",
  user: "admin",
  password: "password",
});

pgClient.connect();

tradesRouter.get("/", async (req, res) => {
  const { symbol } = req.query;

  const response = await pgClient.query(
    `SELECT * FROM tata_transactions WHERE market = $1 ORDER BY time DESC LIMIT 50`,
    [symbol],
  );

  res.json({ payload: response.rows });
});
