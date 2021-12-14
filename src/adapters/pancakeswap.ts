import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { PancakeSwap, PancakeSwapCollectionData } from "../api/pancakeswap";
import { Collection, Sale, HistoricalStatistics } from "../models";
import { handleError, filterMetadata } from "../utils";
import { COINGECKO_IDS } from "../constants";
import { Blockchain, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const collections = await PancakeSwap.getAllCollections();

  const { usd: bnbInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.BSC].geckoId
  );

  console.log(
    "Fetching metadata for PancakeSwap collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for PancakeSwap collection:",
        collection.name
      );
      await fetchCollection(collection, bnbInUSD);
    } catch (e) {
      await handleError(e, "pancakeswap-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const collections = await Collection.getSorted({
    marketplace: Marketplace.PancakeSwap,
  });
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
  const { metadata, statistics } = await PancakeSwap.getCollection(
    collection,
    bnbInUsd
  );

  const filteredMetadata = filterMetadata(metadata);
  const slug = filteredMetadata.slug as string;

  if (!slug) {
    return;
  }

  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.BSC,
    marketplace: Marketplace.PancakeSwap,
  });
}

async function fetchSales(collection: any): Promise<void> {
  const lastSaleTime = await Sale.getLastSaleTime({
    slug: collection.slug,
    marketplace: Marketplace.PancakeSwap,
  });

  try {
    const sales = await PancakeSwap.getSales(collection.address, lastSaleTime);

    if (sales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(sales);

    await Sale.insert({
      slug: collection.slug,
      marketplace: Marketplace.PancakeSwap,
      sales: convertedSales,
    });

    await HistoricalStatistics.updateStatistics({
      slug: collection.slug,
      chain: Blockchain.BSC,
      marketplace: Marketplace.PancakeSwap,
      sales: convertedSales,
    });
  } catch (e) {
    await handleError(e, "pancakeswap-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    await Promise.all([runCollections(), runSales()]);
  } catch (e) {
    await handleError(e, "pancakeswap-adapter");
  }
}

const PancakeSwapAdapter: DataAdapter = { run };
export default PancakeSwapAdapter;
