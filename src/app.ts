import express from "express";
import cors from "cors";
import * as fs from "fs";
import { createConnection } from "typeorm";
import "reflect-metadata";

import { adapters } from "./adapters";
import { AdapterState } from "./models/adapter-state";
import { Collection } from "./models/collection";
import { HistoricalStatistic } from "./models/historical-statistic";
import { Sale } from "./models/sale";
import { Statistic } from "./models/statistic";
import CollectionRoute from "./routes/collection";
import CollectionsRoute from "./routes/collections";
import HistoricalStatisticRoute from "./routes/historical-statistic";
import SearchRoute from "./routes/search";
import StatisticsRoute from "./routes/statistics";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  API_ONLY,
} from "../env";

const html = fs.readFileSync("index.html");
const port = process.env.PORT || 3000;

createConnection({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [AdapterState, Collection, HistoricalStatistic, Sale, Statistic],
  synchronize: true,
  logging: false,
})
  .then(() => {
    if (!API_ONLY) {
      adapters.forEach((adapter) => adapter.run());
    } else {
      const app = express();

      app.use(cors());

      app.use((req, res, next) => {
        res.setHeader("Content-Type", "application/json");
        next();
      });

      app.get("/", (req, res) => res.send(html));
      app.use("/collection", CollectionRoute);
      app.use("/collections", CollectionsRoute);
      app.use("/historical-statistic", HistoricalStatisticRoute);
      app.use("/search", SearchRoute);
      app.use("/statistics", StatisticsRoute);

      app.listen(port, () => {
        console.log(
          `⚡️[server]: Server is running at https://localhost:${port}`
        );
      });
    }
  })
  .catch((error) => console.log(error));
