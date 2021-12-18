import { createConnection } from "typeorm";
import { Sale } from "../src/models/sale";
import { Collection } from "../src/models/collection";
import { Statistic } from "../src/models/statistic";
import { HistoricalStatistic } from "../src/models/historical-statistic";
import { QUERY } from "../src/adapters/historical-statistic-calculator-adapter";
import {
  fetchTokenAddressPrices,
  updateSaleCurrencyConversions,
} from "../src/adapters/currency-converter-adapter";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../env";

const main = () => {
  createConnection({
    type: "postgres",
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    entities: [Sale, Collection, Statistic, HistoricalStatistic],
    synchronize: true,
    logging: false,
  })
    .then(async (connection) => {
      const sales = await Sale.getUnconvertedSales();
      const tokenAddressPrices = await fetchTokenAddressPrices();

      console.log("Manually converting sales");
      await updateSaleCurrencyConversions(sales, tokenAddressPrices);

      console.log("Recalculating historical statistics");
      await Collection.query(QUERY);
    })
    .catch((e) => console.error("Error", e.message));
};

main();
