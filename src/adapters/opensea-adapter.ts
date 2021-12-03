import axios from "axios";
import { Opensea } from "../api/opensea";
import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Sale } from "../models/sale";
import { Statistic } from "../models/statistic";
import { COINGECKO_IDS, ONE_HOUR } from "../constants";
import { sleep, handleError } from "../utils";
import { Coingecko } from "../api/coingecko";
import { Blockchain, LowVolumeError, Marketplace } from "../types";

async function runCollections(): Promise<void> {
  const allCollections = await Collection.findNotFetchedSince(ONE_HOUR);
  const collections = allCollections.filter(
    (collection) => collection.chain === Blockchain.Ethereum
  ); // TODO filter from query

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
        collection.remove();
      }
      await handleError(e, "opensea-adapter:runCollections");
    }
    await sleep(1);
  }
  await Collection.removeDuplicates();
}

async function runSales(): Promise<void> {
  const MAX_INT = 2_147_483_647;
  const collections = await Collection.getSorted(
    "totalVolume",
    "DESC",
    0,
    MAX_INT,
    Blockchain.Ethereum
  );
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
  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const statisticId = (
    await Collection.findOne(address, { relations: ["statistic"] })
  ).statistic?.id;
  const collection = Collection.create({ ...filteredMetadata });
  collection.statistic = Statistic.create({ id: statisticId, ...statistics });
  collection.lastFetched = new Date(Date.now());
  collection.save();
}

async function fetchSales(collection: Collection): Promise<void> {
  let offset = 0;
  const limit = 100;
  const mostRecentSaleTime =
    (await collection.getLastSale(Marketplace.Opensea))?.timestamp?.getTime() ||
    0;
  while (offset <= 10000) {
    try {
      const salesEvents = await Opensea.getSales(
        collection.address,
        mostRecentSaleTime,
        offset,
        limit
      );
      if (salesEvents.length === 0) {
        sleep(3);
        return;
      }
      const sales = salesEvents
        .filter((event) => event !== undefined)
        .reduce(
          (allSales, nextSale) => ({
            ...allSales,
            [nextSale.txnHash]: Sale.create({
              ...nextSale,
              collection: collection,
              marketplace: Marketplace.Opensea,
            }),
          }),
          {}
        );
      Sale.save(Object.values(sales));
      offset += limit;
      await sleep(1);
    } catch (e) {
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
export default OpenseaAdapter;
