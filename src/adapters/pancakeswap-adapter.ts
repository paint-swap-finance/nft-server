import axios from "axios";
import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Coingecko } from "../api/coingecko";
import { PancakeSwap, PancakeSwapCollectionData } from "../api/pancakeswap";
import { sleep, getSlug } from "../utils";
import { ONE_HOUR } from "../constants";
import { Blockchain } from "../types";

async function runCollections(): Promise<void> {
  const collections = await PancakeSwap.getAllCollections();

  console.log("PancakeSwap collections to request:", collections.length);

  const bnbInUSD = await Coingecko.getBnbPrice();
  for (const collection of collections) {
    try {
      await fetchCollection(collection, bnbInUSD);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          console.error("Collection not found:", e.message);
        }
        if (e.response.status === 429) {
          // Backoff for 1 minute if rate limited
          await sleep(60);
        }
      }
      console.log(collection.name);
      console.error("Error retrieving collection data:", e.message);
    }
    await sleep(1);
  }
  await Collection.removeDuplicates();
}

async function runSales(): Promise<void> {
  console.log("running sales");
}

async function fetchCollection(
  collection: PancakeSwapCollectionData,
  bnbInUsd: number
): Promise<void> {
  const existingCollection = await Collection.findSingleFetchedSince(
    getSlug(collection.name),
    ONE_HOUR
  );

  if (existingCollection) {
    // Already exists and has been fetched under the last hour
    return;
  }

  const { metadata, statistics } = await PancakeSwap.getCollection(
    collection,
    bnbInUsd
  );

  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const address = metadata.address;

  const storedCollection = Collection.create({
    ...filteredMetadata,
    chain: Blockchain.Binance,
    defaultTokenId: "",
  });

  const statisticId = (
    await Collection.findOne(address, { relations: ["statistic"] })
  )?.statistic?.id;

  storedCollection.statistic = Statistic.create({
    id: statisticId,
    ...statistics,
  });
  storedCollection.lastFetched = new Date(Date.now());
  storedCollection.save();
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    console.error("PancakeSwap adapter error:", e.message);
  }
}

const PancakeSwapAdapter: DataAdapter = { run };
export default PancakeSwapAdapter;
