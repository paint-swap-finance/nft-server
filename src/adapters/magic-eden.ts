import { DataAdapter } from ".";
import { Collection, HistoricalStatistics, Sale } from "../models";
import { Blockchain, Marketplace } from "../types";
import { MagicEden, MagicEdenCollectionData } from "../api/magic-eden";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { handleError, filterObject } from "../utils";
import { COINGECKO_IDS } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await MagicEden.getAllCollections();

  const { usd: solInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Solana].geckoId
  );

  console.log(
    "Fetching metadata for Magic Eden collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for Magic Eden collection:",
        collection.name
      );
      await fetchCollection(collection, solInUSD);
    } catch (e) {
      await handleError(e, "magic-eden-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const collections = await Collection.getSorted({
    marketplace: Marketplace.MagicEden,
  });

  console.log("Fetching sales for Magic Eden collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for Magic Eden collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: MagicEdenCollectionData,
  solInUSD: number
): Promise<void> {
  const { metadata, statistics } = await MagicEden.getCollection(
    collection,
    solInUSD
  );

  const filteredMetadata = filterObject(metadata);
  const slug = metadata.slug as string;

  if (slug) {
    await Collection.upsert({
      slug,
      metadata: filteredMetadata,
      statistics,
      chain: Blockchain.Solana,
      marketplace: Marketplace.MagicEden,
    });
  }
}

async function fetchSales(collection: any): Promise<void> {
  const lastSaleTime = await Sale.getLastSaleTime({
    slug: collection.slug,
    marketplace: Marketplace.MagicEden,
  });

  try {
    const sales = await MagicEden.getSales(collection, lastSaleTime);
    const filteredSales = sales.filter((sale) => sale);

    if (filteredSales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug: collection.slug,
      marketplace: Marketplace.MagicEden,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug: collection.slug,
        chain: Blockchain.Solana,
        marketplace: Marketplace.MagicEden,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "magic-eden-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    await Promise.all([runCollections(), runSales()]);
  } catch (e) {
    await handleError(e, "magic-eden-adapter");
  }
}

const MagicEdenAdapter: DataAdapter = { run };
export default MagicEdenAdapter;
