import { DataAdapter } from ".";
import { Collection, Sale, HistoricalStatistics } from "../models";
import { Blockchain, Marketplace } from "../types";
import { JpgStore, JpgStoreCollectionData } from "../api/jpg-store";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { sleep, handleError, filterObject } from "../utils";
import { COINGECKO_IDS } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await JpgStore.getAllCollections();

  const { usd: adaInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Cardano].geckoId
  );

  console.log(
    "Fetching metadata for Jpg Store collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for Jpg Store collection:",
        collection.display_name
      );
      await fetchCollection(collection, adaInUSD);
    } catch (e) {
      await handleError(e, "jpg-store-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.JpgStore,
  });

  console.log("Fetching sales for Jpg Store collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for Jpg Store collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: JpgStoreCollectionData,
  adaInUSD: number
): Promise<void> {
  const { metadata, statistics } = await JpgStore.getCollection(
    collection,
    adaInUSD
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
    chain: Blockchain.Cardano,
    marketplace: Marketplace.JpgStore,
  });
}

async function fetchSales(collection: any): Promise<void> {
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.JpgStore,
  });

  try {
    const sales = await JpgStore.getSales(collection, lastSaleTime);
    const filteredSales = sales.filter((sale: any) => sale);

    if (filteredSales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.JpgStore,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain: Blockchain.Cardano,
        marketplace: Marketplace.JpgStore,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "jpg-store-adapter:fetchSales");
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

const JpgStoreAdapter: DataAdapter = { run };

JpgStoreAdapter.run();

export default JpgStoreAdapter;
