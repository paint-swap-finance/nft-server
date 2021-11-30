import express from "express";
import cors from "cors";
import * as fs from "fs";
import { createConnection } from "typeorm";
import { classToPlain, serialize } from "class-transformer";
import "reflect-metadata";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Moralis = require("moralis/node");

import { adapters } from "./adapters";
import { AdapterState } from "./models/adapter-state";
import { Collection } from "./models/collection";
import { HistoricalStatistic } from "./models/historical-statistic";
import { Sale } from "./models/sale";
import { Statistic } from "./models/statistic";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  API_ONLY,
} from "../env";
import { Blockchain, BlockchainReverseLookup } from "./types";

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
  .then((connection) => {
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
          limit,
          Blockchain.Any
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

      app.get("/collections/chain/:chain", async (req, res) => {
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
          limit,
          req.params.chain as Blockchain
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
          relations: ["statistic"],
        });
        if (!collection) {
          res
            .status(404)
            .send(JSON.stringify({ error: "Collection not found" }));
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

      app.get("/statistics/chains", async (req, res) => {
        const data = await Statistic.getChainsSummary();
        const chainData = data.map((elem: any) => {
          const chainName = elem.chain as Blockchain;
          const displayName = BlockchainReverseLookup.get(chainName);
          return {
            ...elem,
            displayName,
          };
        });
        res.send(serialize(chainData));
        res.status(200);
      });

      app.get("/historical-statistic/all/:statistic", async (req, res) => {
        const data = await HistoricalStatistic.getAllStatisticTimeseries(
          req.params.statistic
        );
        res.send(serialize(data));
        res.status(200);
      });

      app.get(
        "/historical-statistic/collections/:slug/:statistic",
        async (req, res) => {
          const data =
            await HistoricalStatistic.getCollectionsStatisticTimeseries(
              req.params.statistic,
              req.params.slug
            );
          res.send(serialize(data));
          res.status(200);
        }
      );

      app.get(
        "/historical-statistic/chains/:chain/:statistic",
        async (req, res) => {
          const data = await HistoricalStatistic.getChainsStatisticTimeseries(
            req.params.statistic,
            req.params.chain
          );
          res.send(serialize(data));
          res.status(200);
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
    }
  })
  .catch((error) => console.log(error));
