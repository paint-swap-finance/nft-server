import { DataAdapter } from ".";
import { Coingecko } from "../api/coingecko";
import { DefiKingdoms } from "../api/defi-kingdoms";
import { CurrencyConverter } from "../api/currency-converter";
import {
  Collection,
  Sale,
  HistoricalStatistics,
  AdapterState,
} from "../models";
import { sleep, handleError, filterObject } from "../utils";
import { Blockchain, Marketplace, SaleData } from "../types";

async function runCollections(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.DefiKingdoms,
  });

  const { usd: jewelInUsd } = await Coingecko.getPricesById("defi-kingdoms");
  const { usd: oneInUsd } = await Coingecko.getPricesById("harmony");
  const jewelInOne = jewelInUsd / oneInUsd;

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

  if (!collections.length) {
    return;
  }

  let adapterState = await AdapterState.getSalesAdapterState(
    Marketplace.DefiKingdoms
  );

  if (!adapterState) {
    adapterState = await AdapterState.createSalesAdapterState(
      Marketplace.DefiKingdoms
    );
  }

  const { lastSyncedBlockNumber } = adapterState;

  console.log(
    "Fetching sales for DefiKingdoms collections from block number",
    lastSyncedBlockNumber
  );

  await fetchSales(collections, parseInt(lastSyncedBlockNumber));
}

async function fetchCollection(
  collection: Collection,
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

async function fetchSales(
  collections: Collection[],
  lastSyncedBlockNumber: number
): Promise<void> {
  try {
    const { sales, latestBlock } = await DefiKingdoms.getSales({
      adapterName: "Defi Kingdoms",
      rpc: "https://harmony-0-rpc.gateway.pokt.network",
      topic:
        "0xe40da2ed231723b222a7ba7da994c3afc3f83a51da76262083e38841e2da0982",
      contractAddress: "0x13a65b9f8039e2c032bc022171dc05b30c3f2892",
      fromBlock: lastSyncedBlockNumber,
      marketplace: Marketplace.DefiKingdoms,
      chain: Blockchain.Harmony,
    });

    if (!sales.length) {
      console.log("No new sales for DefiKingdoms collections");
      return;
    }

    console.log(
      "Matching sales to DefiKingdoms collections:",
      collections.length
    );
    for (const collection of collections) {
      console.log(
        "Matching sales for DefiKingdoms collection:",
        collection.name
      );
      const salesByCollection = sales.filter(
        (sale: SaleData) => sale.contractAddress === collection.address
      );

      if (!salesByCollection.length) {
        console.log(
          "No sales found for DefiKingdoms collection",
          collection.name
        );
        continue;
      }

      const convertedSales = await CurrencyConverter.convertSales(
        salesByCollection
      );

      const slug = collection.slug;
      const salesInserted = await Sale.insert({
        slug,
        marketplace: Marketplace.DefiKingdoms,
        sales: convertedSales,
      });

      if (salesInserted) {
        await HistoricalStatistics.updateStatistics({
          slug,
          chain: Blockchain.Harmony,
          marketplace: Marketplace.DefiKingdoms,
          sales: convertedSales,
        });
        await AdapterState.updateSalesLastSyncedBlockNumber(
          Marketplace.DefiKingdoms,
          latestBlock
        );
      }
    }
  } catch (e) {
    await handleError(e, "defi-kingdoms-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 15);
    }
  } catch (e) {
    await handleError(e, "defi-kingdoms-adapter");
  }
}

const DefiKingdomsAdapter: DataAdapter = { run };

DefiKingdomsAdapter.run();

export default DefiKingdomsAdapter;
