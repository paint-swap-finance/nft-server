import axios from "axios";
import { DataAdapter } from ".";
import { PancakeSwap, PancakeSwapCollectionData } from "../api/pancakeswap";
import { Collection } from "../models/collection";
import { sleep, getSlug } from "../utils";
import { ONE_HOUR } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await PancakeSwap.getAllCollections();

  for (const collection of collections) {
    try {
      await fetchCollection(collection);
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
  collection: PancakeSwapCollectionData
): Promise<void> {
  const existingCollection = await Collection.findSingleFetchedSince(
    getSlug(collection.name),
    ONE_HOUR
  );

  if (existingCollection) {
    // Already exists and has been fetched under the last hour
    return;
  }

  const collectionData = await PancakeSwap.getCollection(collection);

  // Do stuff here
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
