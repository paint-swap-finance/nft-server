import { createConnection } from "typeorm";
import { Sale } from "../src/models/sale";
import { Collection } from "../src/models/collection";
import { Statistic } from "../src/models/statistic";
import { HistoricalStatistic } from "../src/models/historical-statistic";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../env";
import {
  fetchTokenAddressPrices,
  updateSaleCurrencyConversions,
} from "../src/adapters/currency-converter-adapter";

const main = async () => {
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
  }).then(async (connection) => {
    const sales = await Sale.createQueryBuilder("sale")
      .where("sale.price != 0")
      .andWhere("sale.priceBase = 0")
      .getMany();
    const tokenAddressPrices = await fetchTokenAddressPrices();

    await updateSaleCurrencyConversions(sales, tokenAddressPrices);
  });
};

main();
