import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { DefiKingdoms } from "../api/defi-kingdoms";
import { CurrencyConverter } from "../api/currency-converter";
import { HistoricalStatistics } from "../models/historical-statistics";
import { Collection, Sale } from "../models";
import { sleep, handleError, filterObject } from "../utils";
import { Blockchain, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.DefiKingdoms,
  });

  const { usd: jewelInUsd } = await Coingecko.getPricesById(
    "defi-kingdoms"
  );
  const { usd: oneInUsd } = await Coingecko.getPricesById(
    "harmony"
  );
  const jewelInOne = jewelInUsd/oneInUsd

  console.log(
    "Fetching metadata for DefiKingdoms collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for DefiKingdoms collection:",
        collection.name
      );
      await fetchCollection(collection, jewelInUsd, jewelInOne);
    } catch (e) {
      await handleError(e, "defi-kingdoms-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.DefiKingdoms,
  });

  console.log("Fetching sales for DefiKingdoms collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for DefiKingdoms collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: any,
  jewelInUsd: number,
  jewelInOne: number
): Promise<void> {
  const { metadata, statistics } = await DefiKingdoms.getCollection(
    collection,
    jewelInUsd,
    jewelInOne
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
    chain: Blockchain.Harmony,
    marketplace: Marketplace.DefiKingdoms,
  });
}

async function fetchSales(collection: any): Promise<void> {
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.DefiKingdoms,
  });

  try {
    const sales = await DefiKingdoms.getSales(collection.address, lastSaleTime);
    const filteredSales = sales.filter((sale) => sale);

    if (filteredSales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.DefiKingdoms,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain: Blockchain.Arbitrum,
        marketplace: Marketplace.DefiKingdoms,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "defi-kingdoms-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections()]) //,runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "defi-kingdoms-adapter");
  }
}

const DefiKingdomsAdapter: DataAdapter = { run };

DefiKingdomsAdapter.run();

export default DefiKingdomsAdapter;
