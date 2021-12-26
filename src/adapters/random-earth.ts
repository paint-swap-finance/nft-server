import { DataAdapter } from ".";
import { Collection, Sale, HistoricalStatistics } from "../models";
import { Blockchain, Marketplace } from "../types";
import { RandomEarth, RandomEarthCollectionData } from "../api/random-earth";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { sleep, handleError, filterObject } from "../utils";
import { COINGECKO_IDS } from "../constants";

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
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.RandomEarth,
  });

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
  const { metadata, statistics } = await RandomEarth.getCollection(
    collection,
    lunaInUSD
  );

  const filteredMetadata = filterObject(metadata);
  const slug = filteredMetadata.slug as string;

  if (!slug) {
    return;
  }

  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Terra,
    marketplace: Marketplace.RandomEarth,
  });
}

async function fetchSales(collection: any): Promise<void> {
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.RandomEarth,
  });

  try {
    const sales = await RandomEarth.getSales(collection, lastSaleTime);
    const filteredSales = sales.filter((sale: any) => sale);

    if (sales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.RandomEarth,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain: Blockchain.Terra,
        marketplace: Marketplace.RandomEarth,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "random-earth-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "random-earth-adapter");
  }
}

const RandomEarthAdapter: DataAdapter = { run };

RandomEarthAdapter.run();

export default RandomEarthAdapter;
