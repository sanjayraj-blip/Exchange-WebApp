/*
  Why this file?                                                                                                      
  Klines are candlestick data — the price chart. Each candle represents a time interval (1min, 1hour, 1week) and      
  contains Open, High, Low, Close, Volume. TimescaleDB stores these as materialized views that auto-aggregate from raw
   trade data.
*/

import { Router } from "express";
import { Client } from "pg";

export const klineRouter = Router();

const pgClient = new Client({
  host: "localhost",
  port: 5432,
  database: "exchange_db",
  user: "admin",
  password: "password",
});

pgClient.connect();

klineRouter.get("/", async (req, res) => {
  const { symbol, interval, startTime, endTime } = req.query;

  let query;

  if (interval === "1m") {
    query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2 AND market = $3 ORDER BY bucket ASC`;
  } else if (interval === "1h") {
    query = `SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2 AND market = $3 ORDER BY bucket ASC`;
  } else if (interval === "1w") {
    query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2 AND market = $3 ORDER BY bucket ASC`;
  } else {
    res.status(400).json({ error: "Invalid interval" });
    return;
  }

  const response = await pgClient.query(query, [
    new Date(Number(startTime) * 1000),
    new Date(Number(endTime) * 1000),
    symbol,
  ]);

  res.json(
    response.rows.map((row) => ({
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      start: row.bucket,
    })),
  );
});
