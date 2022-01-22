import { DataAdapter } from ".";
import {
  Collection,
  Sale,
  HistoricalStatistics,
  AdapterState,
} from "../models";
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

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.NFTrade,
  });

  if (!collections.length) {
    return;
  }

  let adapterState = await AdapterState.getSalesAdapterState(
    Marketplace.NFTrade
  );

  if (!adapterState) {
    adapterState = await AdapterState.createSalesAdapterState(
      Marketplace.NFTrade
    );
  }

  const { lastSyncedBlockNumber } = adapterState;

  console.log(
    "Fetching sales for NFTrade collections from block number",
    lastSyncedBlockNumber
  );

  await fetchSales(collections, parseInt(lastSyncedBlockNumber));
}

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

  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Avalanche,
    marketplace: Marketplace.NFTrade,
  });
}

async function fetchSales(
  collections: Collection[],
  lastSyncedBlockNumber: number
): Promise<void> {
  try {
    const { sales, latestBlock } = await NFTrade.getSales(
      lastSyncedBlockNumber
    );

    if (!sales.length) {
      console.log("No new sales for NFTrade collections")
      return;
    }

    console.log("Matching sales to NFTrade collections:", collections.length);
    for (const collection of collections) {
      console.log("Matching sales for NFTrade collection:", collection.name);
      const salesByCollection = sales.filter(
        (sale) => sale.contractAddress === collection.address
      );

      if (!salesByCollection.length) {
        console.log("No sales found for NFTrade collection", collection.name);
        continue;
      }

      const convertedSales = await CurrencyConverter.convertSales(
        salesByCollection
      );

      const slug = collection.slug;
      const salesInserted = await Sale.insert({
        slug,
        marketplace: Marketplace.NFTrade,
        sales: convertedSales,
      });

      if (salesInserted) {
        await HistoricalStatistics.updateStatistics({
          slug,
          chain: Blockchain.Avalanche,
          marketplace: Marketplace.NFTrade,
          sales: convertedSales,
        });
        await AdapterState.updateSalesLastSyncedBlockNumber(
          Marketplace.NFTrade,
          latestBlock
        );
      }
    }
  } catch (e) {
    await handleError(e, "nftrade-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "nftrade-adapter");
  }
}

const NFTradeAdapter: DataAdapter = { run };

NFTradeAdapter.run();

export default NFTradeAdapter;
