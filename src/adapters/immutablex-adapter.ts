import axios from "axios";

import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Sale } from "../models/sale";
import { Blockchain, Marketplace } from "../types";
import { ImmutableX, ImmutableXCollectionData } from "../api/immutablex";
import { Coingecko } from "../api/coingecko";
import { sleep, getSlug, handleError } from "../utils";
import { COINGECKO_IDS, ONE_HOUR } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await ImmutableX.getAllCollections();

  const { usd: ethInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Ethereum].geckoId
  );

  console.log("Fetching metadata for IMX collections:", collections.length);

  for (const collection of collections) {
    try {
      console.log("Fetching metadata for IMX collection:", collection.name);
      await fetchCollection(collection, ethInUSD);
    } catch (e) {
      await handleError(e, "immutablex-adapter:runCollections");
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
    Blockchain.ImmutableX
  );

  console.log("Fetching sales for IMX collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for IMX collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: ImmutableXCollectionData,
  ethInUSD: number
): Promise<void> {
  const existingCollection = await Collection.findSingleFetchedSince(
    getSlug(collection.name),
    ONE_HOUR
  );

  if (existingCollection) {
    // Already exists and has been fetched under the last hour
    return;
  }

  const collectionMetadata = await ImmutableX.getCollectionMetadata(collection);
  const filteredMetadata = Object.fromEntries(
    Object.entries(collectionMetadata).filter(([_, v]) => v != null)
  );
  const storedCollection = Collection.create({
    chain: Blockchain.ImmutableX,
    defaultTokenId: "",
    ...filteredMetadata,
  });

  const collectionStatistics = await ImmutableX.getCollectionStatistics(
    collection,
    ethInUSD
  );

  const statisticId = (
    await Collection.findOne(collection.address, { relations: ["statistic"] })
  )?.statistic?.id;

  if (statisticId) {
    storedCollection.statistic = Statistic.create({
      id: statisticId,
      ...collectionStatistics,
    }) as unknown as Statistic;
  } else {
    storedCollection.statistic = Statistic.create({
      ...collectionStatistics,
    }) as unknown as Statistic;
  }
  storedCollection.lastFetched = new Date(Date.now());
  storedCollection.save();
}

async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (
      await collection.getLastSale(Marketplace.ImmutableX)
    )?.timestamp?.getTime() || 0;
  try {
    const salesEvents = await ImmutableX.getSales(
      collection,
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
            collection: collection,
            marketplace: Marketplace.ImmutableX,
          }),
        }),
        {}
      );

    Sale.save(Object.values(sales));
    await sleep(1);
  } catch (e) {
    await handleError(e, "immutablex-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "immutablex-adapter");
  }
}

const ImmutableXAdapter: DataAdapter = { run };
export default ImmutableXAdapter;
