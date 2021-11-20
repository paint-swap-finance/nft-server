import express from "express";
import cors from "cors";
import * as fs from "fs";
import { createConnection } from "typeorm";
import { classToPlain, serialize } from "class-transformer";
import "reflect-metadata";

import { adapters } from "./adapters";
import { AdapterState } from "./models/adapter-state";
import { Collection } from "./models/collection";
import { HistoricalStatistic } from "./models/historical-statistic";
import { Sale } from "./models/sale";
import { Statistic } from "./models/statistic";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../env";

const html = fs.readFileSync("index.html");
const port = process.env.PORT || 3000;
const log = (entry: string) =>
  fs.appendFileSync(
    "/tmp/sample-app.log",
    new Date().toISOString() + " - " + entry + "\n"
  );

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
  .then((connection) => {
    if (!process.env.API_ONLY) {
      adapters.forEach((adapter) => adapter.run());
    }

    const app = express();
    app.use(cors());
    app.use((req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      next();
    });

    app.get("/", (req, res) => res.send(html));

    app.get("/collections", async (req, res) => {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 100;
      const sortBy = (req.query.sort as string) || "dailyVolume";
      const sortDirection = (req.query.direction as string) || "DESC";
      if (sortDirection !== "ASC" && sortDirection !== "DESC") {
        res.status(400);
        res.send(JSON.stringify({ error: "Invalid sort direction" }));
        return;
      }

      const collections = await Collection.getSorted(
        sortBy,
        sortDirection,
        page,
        limit
      );
      const flattenedCollections = collections.map((collection) => {
        const obj = classToPlain(collection);
        const statObj = collection.statistic;
        delete obj.statistic;
        delete statObj.id;
        return {
          ...obj,
          ...statObj,
        };
      });
      res.send(serialize(flattenedCollections));
      res.status(200);
    });

    app.get("/collection/:slug", async (req, res) => {
      const collection = await Collection.findOne({
        where: { slug: req.params.slug },
      });
      if (!collection) {
        res.status(404).send(JSON.stringify({ error: "Collection not found" }));
        return;
      }
      res.send(serialize(collection));
      res.status(200);
    });

    app.get("/statistics", async (req, res) => {
      const data = await Statistic.getSummary();
      res.send(serialize(data));
      res.status(200);
    });

    app.get(
      "/historical-statistic/:collection/:statistic",
      async (req, res) => {
        if (req.params.collection === "total") {
          const data = await HistoricalStatistic.getStatisticTimeseries(
            req.params.statistic
          );
          res.send(serialize(data));
          res.status(200);
        }
      }
    );

    app.get("/search", async (req, res) => {
      if (!req.query.searchTerm || req.query.searchTerm === "") {
        res.send([]);
        res.status(200);
        return;
      }
      const searchTerm = (req.query.searchTerm as string).toLowerCase();
      const collections = await Collection.search(searchTerm);
      res.send(serialize(collections));
      res.status(200);
    });

    app.listen(port, () => {
      console.log(
        `⚡️[server]: Server is running at https://localhost:${port}`
      );
    });
  })
  .catch((error) => console.log(error));
