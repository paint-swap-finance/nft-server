import { Router } from "express";
import { classToPlain, serialize } from "class-transformer";
import { Collection } from "../models/collection";
import { Blockchain } from "../types";

const router = Router();

router.get("/", async (req, res) => {
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

router.get("/chain/:chain", async (req, res) => {
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

export default router;
