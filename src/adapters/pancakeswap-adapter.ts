import axios from "axios";

import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Sale } from "../models/sale";
import { Coingecko } from "../api/coingecko";
import { PancakeSwap, PancakeSwapCollectionData } from "../api/pancakeswap";
import { sleep, getSlug, handleError } from "../utils";
import { COINGECKO_IDS, ONE_HOUR } from "../constants";
import { Blockchain, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const collections = await PancakeSwap.getAllCollections();

  console.log("PancakeSwap collections to request:", collections.length);

  const { usd: bnbInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Binance].geckoId
  );

  for (const collection of collections) {
    try {
      await fetchCollection(collection, bnbInUSD);
    } catch (e) {
      await handleError(e, "pancakeswap-adapter:runCollections");
    }
    await sleep(1);
  }
  await Collection.removeDuplicates();
}

async function runSales(): Promise<void> {
  const MAX_INT = 2_147_483_647;
  const collections = await Collection.getSorted(
    "totalVolume",
    "DESC",
    0,
    MAX_INT,
    Blockchain.Binance
  );
  console.log(
    "Fetching sales for PancakeSwap collections:",
    collections.length
  );
  for (const collection of collections) {
    console.log("Fetching sales for PancakeSwap collection:", collection.name);
    await fetchSales(collection);
  }
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

async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (
      await collection.getLastSale(Marketplace.PancakeSwap)
    )?.timestamp?.getTime() || 0;

  try {
    const salesEvents = await PancakeSwap.getSales(
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
            marketplace: Marketplace.PancakeSwap,
          }),
        }),
        {}
      );
    Sale.save(Object.values(sales), { chunk: 1000 });
    await sleep(1);
  } catch (e) {
    await handleError(e, "pancakeswap-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "pancakeswap-adapter");
  }
}

const PancakeSwapAdapter: DataAdapter = { run };
export default PancakeSwapAdapter;
