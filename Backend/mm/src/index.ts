import axios from "axios";

const BASE_URL = "http://localhost:3000";
const MARKET = "TATA_INR";
const USER_ID = "5";

async function main() {
  console.log("Market maker started");

  setInterval(async () => {
    try {
      const price = 1000 + Math.random() * 10;
      const quantity = Math.floor(Math.random() * 10) + 1;

      // place a buy order slightly below current price
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: MARKET,
        price: (price - 1).toFixed(2),
        quantity: String(quantity),
        side: "buy",
        userId: USER_ID,
      });

      // place a sell order slightly above current price
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: MARKET,
        price: (price + 1).toFixed(2),
        quantity: String(quantity),
        side: "sell",
        userId: USER_ID,
      });

      console.log(
        `Placed buy @ ${(price - 1).toFixed(2)} and sell @ ${(price + 1).toFixed(2)}`,
      );
    } catch (e) {
      console.error("Error placing orders", e);
    }
  }, 1000);
}

main();
