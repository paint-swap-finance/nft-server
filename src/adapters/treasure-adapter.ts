import axios from "axios";

import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Sale } from "../models/sale";
import { Coingecko } from "../api/coingecko";
import { sleep, getSlug } from "../utils";
import { ONE_HOUR } from "../constants";
import { Blockchain, Marketplace } from "../types";
import { Treasure } from "../api/treasure";

async function runCollections(): Promise<void> {
  const collections = await Collection.findByChain(Blockchain.Arbitrum); // TODO filter by marketplace too

  console.log("Treasure collections to request:", collections.length);

  const { usd: magicInUsd, eth: magicInEth } = await Coingecko.getPricesById(
    "magic"
  );

  for (const collection of collections) {
    try {
      await fetchCollection(collection, magicInUsd, magicInEth);
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
  const collections = await Collection.findByChain(Blockchain.Arbitrum); // TODO filter by marketplace too

  console.log("Fetching sales for Treasure collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for Treasure collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: Collection,
  magicInUsd: number,
  magicInEth: number
): Promise<void> {
  const existingCollection = await Collection.findSingleFetchedSince(
    getSlug(collection.name),
    ONE_HOUR
  );

  if (existingCollection) {
    // Already exists and has been fetched under the last hour
    return;
  }

  const { metadata, statistics } = await Treasure.getCollection(
    collection,
    magicInUsd,
    magicInEth,
  );

  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const address = metadata.address;

  const storedCollection = Collection.create({
    ...filteredMetadata,
    chain: Blockchain.Arbitrum,
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

async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (
      await collection.getLastSale(Marketplace.Treasure)
    )?.timestamp?.getTime() || 0;

  try {
    const salesEvents = await Treasure.getSales(
      collection.address,
      mostRecentSaleTime
    );
    if (salesEvents.length === 0) {
      sleep(3);
      return;
    }
    const sales = salesEvents
      .filter((event) => event !== undefined)
      .reduce(
        (allSales, nextSale) => ({
          ...allSales,
          [nextSale.txnHash]: Sale.create({
            ...nextSale,
            collection,
            marketplace: Marketplace.Treasure,
          }),
        }),
        {}
      );
    Sale.save(Object.values(sales), { chunk: 1000 });
    await sleep(1);
  } catch (e) {
    console.error("Error retrieving sales data:", e.message);

    if (axios.isAxiosError(e)) {
      if (
        e.response.status === 404 ||
        e.response.status === 500 ||
        e.response.status === 504
      ) {
        console.error("Error retrieving sales data:", e.message);
        return;
      }
      if (e.response.status === 429) {
        // Backoff for 1 minute if rate limited
        await sleep(60);
      }
    }
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    console.error("Treasure adapter error:", e.message);
  }
}

const TreasureAdapter: DataAdapter = { run };
export default TreasureAdapter;
