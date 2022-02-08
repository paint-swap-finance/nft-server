import { DataAdapter } from ".";
import { Collection, Sale, HistoricalStatistics } from "../models";
import { Blockchain, CollectionData, Marketplace } from "../types";
import { ImmutableX, ImmutableXCollectionData } from "../api/immutablex";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { handleError, filterObject, sleep } from "../utils";
import { COINGECKO_IDS } from "../constants";

async function runCollections(): Promise<void> {
  const collections = await ImmutableX.getAllCollections();

  const { usd: ethInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Ethereum].geckoId
  );

  console.log("Fetching metadata for IMX collections:", collections.length);

  for (const collection of collections) {
    try {
      console.log("Fetching metadata for IMX collection:", collection.name);
      await fetchCollection(collection, ethInUSD);
    } catch (e) {
      await handleError(e, "immutablex-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.ImmutableX,
  });

  console.log("Fetching sales for IMX collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for IMX collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: ImmutableXCollectionData,
  ethInUSD: number
): Promise<void> {
  const metadata = await ImmutableX.getCollectionMetadata(collection);
  const statistics = await ImmutableX.getCollectionStatistics(
    collection,
    ethInUSD
  );

  const filteredMetadata = filterObject(metadata) as CollectionData;
  const slug = filteredMetadata.slug as string;

  await Collection.upsert({
    slug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.ImmutableX,
    marketplace: Marketplace.ImmutableX,
  });
}

async function fetchSales(collection: Collection): Promise<void> {
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.ImmutableX,
  });

  try {
    const sales = await ImmutableX.getSales(collection, lastSaleTime);
    const filteredSales = sales.filter((sale) => sale);

    if (filteredSales.length === 0) {
      return;
    }

    const convertedSales = await CurrencyConverter.convertSales(filteredSales);

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.ImmutableX,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain: Blockchain.ImmutableX,
        marketplace: Marketplace.ImmutableX,
        sales: convertedSales,
      });
    }
  } catch (e) {
    await handleError(e, "immutablex-adapter:fetchSales");
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "immutablex-adapter");
  }
}

const ImmutableXAdapter: DataAdapter = { run };

ImmutableXAdapter.run();

export default ImmutableXAdapter;
