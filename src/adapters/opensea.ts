import axios from "axios";
import { DataAdapter } from ".";
import { Collection, Contract, Sale, HistoricalStatistics } from "../models";
import { Opensea } from "../api/opensea";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { COINGECKO_IDS } from "../constants";
import { sleep, handleError, filterObject } from "../utils";
import { Blockchain, LowVolumeError, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const collections = await Contract.getAll(Blockchain.Ethereum);

  if (collections.length === 0) {
    console.log("No OpenSea collections to request...");
    return;
  }

  const { usd: ethInUSD } = await Coingecko.getPricesById(
    COINGECKO_IDS[Blockchain.Ethereum].geckoId
  );

  console.log("Fetching metadata for Opensea collections:", collections.length);

  for (const collection of collections) {
    try {
      console.log(
        "Fetching metadata for Opensea collection:",
        collection?.name || "No name"
      );
      await fetchCollection(
        collection.slug,
        collection.address,
        collection.defaultTokenId,
        ethInUSD
      );
    } catch (e) {
      if (e instanceof LowVolumeError) {
        await Contract.remove(Blockchain.Ethereum, collection.address);
      }
      await handleError(e, "opensea-adapter:runCollections");
    }
  }
}

async function runSales(): Promise<void> {
  const { data: collections } = await Collection.getSorted({
    marketplace: Marketplace.Opensea,
  });

  console.log("Fetching sales for OpenSea collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching sales for OpenSea collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  slug: string,
  address: string,
  tokenId: string,
  ethInUSD: number
) {
  let fetchedSlug = "";
  if (!slug) {
    fetchedSlug = (await Opensea.getContract(address, tokenId)).slug;
  }
  const { metadata, statistics } = await Opensea.getCollection(
    address,
    slug || fetchedSlug,
    ethInUSD
  );
  const filteredMetadata = filterObject(metadata);

  await Collection.upsert({
    slug: slug || fetchedSlug,
    metadata: filteredMetadata,
    statistics,
    chain: Blockchain.Ethereum,
    marketplace: Marketplace.Opensea,
  });
}

async function fetchSales(collection: Collection): Promise<void> {
  let offset = 0;
  const limit = 300;
  const slug = collection.slug;
  const lastSaleTime = await Sale.getLastSaleTime({
    slug,
    marketplace: Marketplace.Opensea,
  });

  while (offset <= 10000) {
    try {
      const sales = await Opensea.getSales(
        collection.address,
        lastSaleTime,
        offset,
        limit
      );
      const filteredSales = sales.filter((sale) => sale);

      if (filteredSales.length === 0) {
        sleep(3);
        return;
      }

      const convertedSales = await CurrencyConverter.convertSales(
        filteredSales
      );

      const salesInserted = await Sale.insert({
        slug,
        marketplace: Marketplace.Opensea,
        sales: convertedSales,
      });

      if (salesInserted) {
        await HistoricalStatistics.updateStatistics({
          slug,
          chain: Blockchain.Ethereum,
          marketplace: Marketplace.Opensea,
          sales: convertedSales,
        });
      }
      offset += limit;
      await sleep(1);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response.status === 500) {
          console.error(
            "Error [opensea-adapter:fetchSales]: offset not valid or server error"
          );
          break;
        }
      }
      await handleError(e, "opensea-adapter:fetchSales");
      continue;
    }
  }
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([runCollections(), runSales()]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "opensea-adapter");
  }
}

const OpenseaAdapter: DataAdapter = { run };

OpenseaAdapter.run();

export default OpenseaAdapter;
