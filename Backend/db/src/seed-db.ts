import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "exchange_db",
  user: "admin",
  password: "password",
});

async function main() {
  await client.connect();

  // 1. create the transactions table
  await client.query(`
      CREATE TABLE IF NOT EXISTS tata_transactions (
        id           VARCHAR(255) NOT NULL,
        isBuyerMaker BOOLEAN NOT NULL,
        price        DECIMAL NOT NULL,
        quantity     DECIMAL NOT NULL,
        quoteQuantity DECIMAL NOT NULL,
        timestamp    BIGINT NOT NULL,
        market       VARCHAR(255) NOT NULL,
        time         TIMESTAMPTZ NOT NULL
      );
    `);

  console.log("Created tata_transactions table");

  // 2. convert to hypertable (TimescaleDB time-series optimization)
  await client.query(`
      SELECT create_hypertable('tata_transactions', 'time', if_not_exists => TRUE);
    `);

  console.log("Created hypertable");

  // 3. create 1 minute klines materialized view
  await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 minute', time) AS bucket,
        first(price, time)            AS open,
        max(price)                    AS high,
        min(price)                    AS low,
        last(price, time)             AS close,
        sum(quantity)                 AS volume,
        market
      FROM tata_transactions
      GROUP BY bucket, market
      WITH NO DATA;
    `);

  console.log("Created klines_1m");

  // 4. create 1 hour klines materialized view
  await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 hour', time)   AS bucket,
        first(price, time)            AS open,
        max(price)                    AS high,
        min(price)                    AS low,
        last(price, time)             AS close,
        sum(quantity)                 AS volume,
        market
      FROM tata_transactions
      GROUP BY bucket, market
      WITH NO DATA;
    `);

  console.log("Created klines_1h");

  // 5. create 1 week klines materialized view
  await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 week', time)   AS bucket,
        first(price, time)            AS open,
        max(price)                    AS high,
        min(price)                    AS low,
        last(price, time)             AS close,
        sum(quantity)                 AS volume,
        market
      FROM tata_transactions
      GROUP BY bucket, market
      WITH NO DATA;
    `);

  console.log("Created klines_1w");

  await client.end();
  console.log("Database seeded successfully");
}

main();
