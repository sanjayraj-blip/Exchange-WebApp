import { Client } from "pg";
import { createClient } from "redis";
import { startCron } from "./cron";
import { DbMessage, ORDER_UPDATE, TRADE_ADDED } from "./types";

const pgClient = new Client({
  host: "localhost",
  port: 5433,
  database: "exchange_db",
  user: "admin",
  password: "password",
});

async function main() {
  await pgClient.connect();
  console.log("Connected to TimescaleDB");

  startCron(pgClient);

  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");

  while (true) {
    const response = await redisClient.rPop("db_processor");
    if (response) {
      const message: DbMessage = JSON.parse(response.toString());

      if (message.type === TRADE_ADDED) {
        await pgClient.query(
          `INSERT INTO tata_transactions (id, isBuyerMaker, price, quantity, quoteQuantity, timestamp, market, time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            message.data.id,
            message.data.isBuyerMaker,
            message.data.price,
            message.data.quantity,
            message.data.quoteQuantity,
            message.data.timestamp,
            message.data.market,
            new Date(message.data.timestamp),
          ],
        );
      }

      if (message.type === ORDER_UPDATE) {
        // first time an order is seen — insert it
        if (message.data.market) {
          await pgClient.query(
            `INSERT INTO orders (order_id, executed_qty, market, price, quantity, side)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (order_id) DO UPDATE SET executed_qty = $2`,
            [
              message.data.orderId,
              message.data.executedQty,
              message.data.market,
              message.data.price,
              message.data.quantity,
              message.data.side,
            ],
          );
        } else {
          // subsequent update — just update executed quantity
          await pgClient.query(
            `UPDATE orders SET executed_qty = executed_qty + $1 WHERE order_id = $2`,
            [message.data.executedQty, message.data.orderId],
          );
        }
      }
    }
  }
}

main();
