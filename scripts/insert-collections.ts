import { createConnection } from "typeorm";
import { Sale } from "../src/models/sale";
import { Collection } from "../src/models/collection";
import { Statistic } from "../src/models/statistic";
import { HistoricalStatistic } from "../src/models/historical-statistic";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../env";
import { Blockchain } from "../src/types";

const collections = [
  {
    address: "",
    slug: "",
    chain: Blockchain.Any,
    name: "",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "",
    website: "",
  },
];

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
      console.log("Manually inserting", collections.length, "collections");
      for (const collection of collections) {
        console.log("Inserting collection", collection.name);
        const storedCollection = await Collection.create({ ...collection });
        await storedCollection.save();
      }
    })
    .catch((e) => console.error("Error", e.message));
};

main();
