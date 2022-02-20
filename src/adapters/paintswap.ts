import { DataAdapter } from ".";
import {
  Collection,
  Sale,
  HistoricalStatistics,
  AdapterState,
} from "../models";
import { Blockchain, CollectionData, Marketplace } from "../types";
import { PaintSwap, PaintSwapCollectionData } from "../api/paintswap";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { sleep, handleError, filterObject, getSalesFromLogs } from "../utils";
import { COINGECKO_IDS } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await PaintSwap.getAllCollections();

  const { usd: ftmInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Fantom].geckoId
  );

  console.log(
    "Fetching metadata for PaintSwap collections:",
    collections.length
  );

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for PaintSwap collection:",
        collection.name
      );
      await fetchCollection(collection, ftmInUSD);
    } catch (e) {
      await handleError(e, "paintswap-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.PaintSwap,
  });

  if (!collections.length) {
    return;
  }

  let adapterState = await AdapterState.getSalesAdapterState(
    Marketplace.PaintSwap
  );

  if (!adapterState) {
    adapterState = await AdapterState.createSalesAdapterState(
      Marketplace.PaintSwap
    );
  }

  const { lastSyncedBlockNumber } = adapterState;

  console.log(
    "Fetching sales for PaintSwap collections from block number",
    lastSyncedBlockNumber
  );

  await fetchSales(collections, parseInt(lastSyncedBlockNumber));
}

async function fetchCollection(
  collection: PaintSwapCollectionData,
  ftmInUSD: number
): Promise<void> {
  const { metadata, statistics } = await PaintSwap.getCollection(
    collection,
    ftmInUSD
  );

  const filteredMetadata = filterObject(metadata) as CollectionData;
  const slug = filteredMetadata.slug as string;

  if (!slug) {
    return;
  }

  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Fantom,
    marketplace: Marketplace.PaintSwap,
  });
}

async function fetchSales(
  collections: Collection[],
  lastSyncedBlockNumber: number
): Promise<void> {
  try {
    const { sales, latestBlock } = await getSalesFromLogs({
      adapterName: "Paintswap",
      rpc: "https://rpc.ftm.tools",
      topic:
        "0x0cda439d506dbc3b73fe10f062cf285c4e75fe85d310decf4b8239841879ed61",
      contractAddress: "0x6125fd14b6790d5f66509b7aa53274c93dae70b9",
      fromBlock: lastSyncedBlockNumber,
      marketplace: Marketplace.PaintSwap,
      chain: Blockchain.Fantom,
      parser: PaintSwap.parseSalesFromLogs,
    });

    if (!sales.length) {
      console.log("No new sales for PaintSwap collections")
      return;
    }

    console.log("Matching sales to PaintSwap collections:", collections.length);
    for (const collection of collections) {
      console.log("Matching sales for PaintSwap collection:", collection.name);
      const salesByCollection = sales.filter(
        (sale) => sale.contractAddress === collection.address
      );

      if (!salesByCollection.length) {
        console.log("No sales found for PaintSwap collection", collection.name);
        continue;
      }

      const convertedSales = await CurrencyConverter.convertSales(
        salesByCollection
      );

      const slug = collection.slug;
      const salesInserted = await Sale.insert({
        slug,
        marketplace: Marketplace.PaintSwap,
        sales: convertedSales,
      });

      if (salesInserted) {
        await HistoricalStatistics.updateStatistics({
          slug,
          chain: Blockchain.Fantom,
          marketplace: Marketplace.PaintSwap,
          sales: convertedSales,
        });
        await AdapterState.updateSalesLastSyncedBlockNumber(
          Marketplace.PaintSwap,
          latestBlock
        );
      }
    }
  } catch (e) {
    await handleError(e, "paintswap-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "paintswap-adapter");
  }
}

const PaintSwapAdapter: DataAdapter = { run };

PaintSwapAdapter.run();

export default PaintSwapAdapter;
