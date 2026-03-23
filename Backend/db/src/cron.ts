/*
  The full picture

  Trades come in constantly → stored in raw trades table
                                      │
                           (every 10 seconds)
                                      ▼
                      cron refreshes klines_1m, klines_1h, klines_1w
                                      │
                           (user opens chart)
                                      ▼
                      query hits pre-computed klines → fast response

  Without this cron, the candle data would be stale. With it, charts
  are at most 10 seconds behind real trades.
*/

import { Client } from "pg";

async function refreshViews(pgClient: Client) {
  await pgClient.query(
    "CALL refresh_continuous_aggregate('klines_1m', NULL, NULL);",
  );
  await pgClient.query(
    "CALL refresh_continuous_aggregate('klines_1h', NULL, NULL);",
  );
  await pgClient.query(
    "CALL refresh_continuous_aggregate('klines_1w', NULL, NULL);",
  );
  console.log("Refreshed materialized views at", new Date().toISOString());
}

export function startCron(pgClient: Client) {
  setInterval(async () => {
    try {
      await refreshViews(pgClient);
    } catch (e) {
      console.error("Error refreshing views", e);
    }
  }, 1000 * 10);
}
