import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Sale } from "../models/sale";
import { Blockchain, Marketplace } from "../types";
import { RandomEarth, RandomEarthCollectionData } from "../api/random-earth";
import { Coingecko } from "../api/coingecko";
import { sleep, handleError, getSlug } from "../utils";
import { COINGECKO_IDS, ONE_HOUR } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await RandomEarth.getAllCollections();

  const { usd: lunaInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Terra].geckoId
  );

  console.log(
    "Fetching metadata for Random Earth collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for Random Earth collection:",
        collection.name
      );
      await fetchCollection(collection, lunaInUSD);
    } catch (e) {
      await handleError(e, "random-earth-adapter:runCollections");
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
    Blockchain.Solana
  );

  console.log(
    "Fetching sales for Random Earth collections:",
    collections.length
  );
  for (const collection of collections) {
    console.log("Fetching sales for Random Earth collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: RandomEarthCollectionData,
  lunaInUSD: number
): Promise<void> {
  const existingCollection = await Collection.findSingleFetchedSince(
    getSlug(collection.name),
    ONE_HOUR
  );

  if (existingCollection) {
    // Already exists and has been fetched under the last hour
    return;
  }

  const { metadata, statistics } = await RandomEarth.getCollection(
    collection,
    lunaInUSD
  );

  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const { address } = metadata;

  if (address) {
    const storedCollection = Collection.create({
      ...filteredMetadata,
      address,
      chain: Blockchain.Terra,
      defaultTokenId: "",
    });

    const statisticId = (
      await Collection.findOne(address, { relations: ["statistic"] })
    )?.statistic?.id;

    if (statisticId) {
      storedCollection.statistic = Statistic.create({
        id: statisticId,
        ...statistics,
      });
    } else {
      storedCollection.statistic = Statistic.create({ ...statistics });
    }

    storedCollection.lastFetched = new Date(Date.now());
    storedCollection.save();
  }
}

async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (
      await collection.getLastSale(Marketplace.MagicEden)
    )?.timestamp?.getTime() || 0;
  try {
    const salesEvents = await RandomEarth.getSales(
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
            marketplace: Marketplace.MagicEden,
          }),
        }),
        {}
      );

    Sale.save(Object.values(sales));
    await sleep(1);
  } catch (e) {
    await handleError(e, "random-earth-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections() /*, runSales()*/]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "random-earth-adapter");
  }
}

const RandomEarthAdapter: DataAdapter = { run };
export default RandomEarthAdapter;
