import { Router } from "express";
import { serialize } from "class-transformer";
import { HistoricalStatistic } from "../models/historical-statistic";

const router = Router();

router.get("/all/:statistic", async (req, res) => {
  const data = await HistoricalStatistic.getAllStatisticTimeseries(
    req.params.statistic
  );
  res.send(serialize(data));
  res.status(200);
});

router.get(
  "/collection/:slug/:statistic",
  async (req, res) => {
    const data = await HistoricalStatistic.getCollectionsStatisticTimeseries(
      req.params.statistic,
      req.params.slug
    );
    res.send(serialize(data));
    res.status(200);
  }
);

router.get(
  "/chain/:chain/:statistic",
  async (req, res) => {
    const data = await HistoricalStatistic.getChainsStatisticTimeseries(
      req.params.statistic,
      req.params.chain
    );
    res.send(serialize(data));
    res.status(200);
  }
);

export default router;
