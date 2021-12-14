import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { Treasure } from "../api/treasure";
import { CurrencyConverter } from "../api/currency-converter";
import { HistoricalStatistics } from "../api/historical-statistics";
import { handleError, filterMetadata } from "../utils";
import {
  getSortedCollections,
  upsertCollection,
  insertSales,
  getLastSaleTime,
} from "../utils/dynamodb";
import { Blockchain, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const collections = await getSortedCollections({
    marketplace: Marketplace.Treasure,
  });

  const { usd: magicInUsd, eth: magicInEth } = await Coingecko.getPricesById(
    "magic"
  );

  console.log(
    "Fetching metadata for Treasure collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for Treasure collection:",
        collection.name
      );
      await fetchCollection(collection, magicInUsd, magicInEth);
    } catch (e) {
      await handleError(e, "treasure-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const collections = await getSortedCollections({
    marketplace: Marketplace.Treasure,
  });

  console.log("Fetching sales for Treasure collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for Treasure collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: any,
  magicInUsd: number,
  magicInEth: number
): Promise<void> {
  const { metadata, statistics } = await Treasure.getCollection(
    collection,
    magicInUsd,
    magicInEth
  );

  const filteredMetadata = filterMetadata(metadata);
  const slug = filteredMetadata.slug as string;

  if (!slug) {
    return;
  }

  await upsertCollection({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Arbitrum,
    marketplace: Marketplace.PancakeSwap,
  });
}

async function fetchSales(collection: any): Promise<void> {
  const lastSaleTime = await getLastSaleTime({
    slug: collection.slug,
    marketplace: Marketplace.Treasure,
  });

  try {
    const sales = await Treasure.getSales(collection.address, lastSaleTime);

    if (sales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(sales);

    insertSales({
      slug: collection.slug,
      marketplace: Marketplace.Treasure,
      sales: convertedSales,
    });

    HistoricalStatistics.updateStatistics({
      slug: collection.slug,
      chain: Blockchain.Arbitrum,
      marketplace: Marketplace.Treasure,
      sales: convertedSales,
    });
  } catch (e) {
    await handleError(e, "treasure-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    await Promise.all([runCollections(), runSales()]);
  } catch (e) {
    await handleError(e, "treasure-adapter");
  }
}

const TreasureAdapter: DataAdapter = { run };
export default TreasureAdapter;
