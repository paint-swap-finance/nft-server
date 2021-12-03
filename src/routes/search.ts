import { Router } from "express";
import { serialize } from "class-transformer";
import { Collection } from "../models/collection";

const router = Router();

router.get("/", async (req, res) => {
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

export default router;
