import { Router } from "express";
import { serialize } from "class-transformer";
import { Collection } from "../models/collection";

const router = Router();

router.get("/:slug", async (req, res) => {
  const collection = await Collection.findOne({
    where: { slug: req.params.slug },
    relations: ["statistic"],
  });
  if (!collection) {
    res.status(404).send(JSON.stringify({ error: "Collection not found" }));
    return;
  }
  res.send(serialize(collection));
  res.status(200);
});

export default router;
