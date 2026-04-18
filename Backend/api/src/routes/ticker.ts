/*
Why this file?                                                                                                      
  The ticker shows the 24h summary for a market — current price, 24h high, 24h low, volume. The frontend displays this
   in the top bar. This is read directly from TimescaleDB using the klines_1h materialized view — no need to go       
  through the engine.   
*/

import { Router } from "express";
import { Client } from "pg";

export const tickerRouter = Router();

const pgClient = new Client({
  host: "localhost",
  port: 5433,
  database: "exchange_db",
  user: "admin",
  password: "password",
});

pgClient.connect();

// GET /api/v1/tickers?market=TATA_INR
tickerRouter.get("/", async (req, res) => {
  const { market } = req.query;

  const response = await pgClient.query(
    `SELECT
        first(open, bucket)  AS open,
        max(high)            AS high,
        min(low)             AS low,
        last(close, bucket)  AS close,
        sum(volume)          AS volume
      FROM klines_1h
      WHERE market = $1
        AND bucket >= NOW() - INTERVAL '24 hours'`,
    [market],
  );

  const row = response.rows[0];

  res.json({
    payload: {
      firstPrice: row.open,
      high: row.high,
      low: row.low,
      lastPrice: row.close,
      volume: row.volume,
    },
  });
});
