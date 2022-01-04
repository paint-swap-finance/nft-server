import { DataAdapter } from ".";
import { Collection, Sale, HistoricalStatistics } from "../models";
import { Blockchain, Marketplace } from "../types";
import { NFTrade, NFTradeCollectionData } from "../api/nftrade";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { sleep, handleError, filterObject } from "../utils";
import { COINGECKO_IDS } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await NFTrade.getAllCollections();

  const { usd: avaxInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Avalanche].geckoId
  );

  console.log("Fetching metadata for NFTrade collections:", collections.length);

  for (const collection of collections) {
    try {
      console.log("Fetching metadata for NFTrade collection:", collection.name);
      await fetchCollection(collection, avaxInUSD);
    } catch (e) {
      await handleError(e, "nftrade-adapter:runCollections");
    }
  }
}

/*
async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.NFTrade,
  });

  console.log("Fetching sales for Jpg Store collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for Jpg Store collection:", collection.name);
    await fetchSales(collection);
  }
}
*/

async function fetchCollection(
  collection: NFTradeCollectionData,
  avaxInUSD: number
): Promise<void> {
  const { metadata, statistics } = await NFTrade.getCollection(
    collection,
    avaxInUSD
  );

  const filteredMetadata = filterObject(metadata);
  const slug = filteredMetadata.slug as string;

  if (!slug) {
    return;
  }

  console.log("SLUG:", slug);
  console.log(filteredMetadata);
  console.log(statistics);

  /*
  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Cardano,
    marketplace: Marketplace.NFTrade,
  });
  */
}

/*
async function fetchSales(collection: any): Promise<void> {
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.NFTrade,
  });

  try {
    const sales = await NFTrade.getSales(collection, lastSaleTime);
    const filteredSales = sales.filter((sale: any) => sale);

    if (filteredSales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.NFTrade,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain: Blockchain.Cardano,
        marketplace: Marketplace.NFTrade,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "nftrade-adapter:fetchSales");
  }
}
*/

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([
        runCollections(),
        //runSales()
      ]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "nftrade-adapter");
  }
}

const NFTradeAdapter: DataAdapter = { run };

NFTradeAdapter.run();

export default NFTradeAdapter;
