import axios from "axios";
import { Opensea } from "../api/opensea";
import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Sale } from "../models/sale";
import { Statistic } from "../models/statistic";
import { sleep } from "../utils";
import { Coingecko } from "../api/coingecko";
import { Blockchain, LowVolumeError, Marketplace } from "../types";

const ONE_HOUR = 1;

async function run(): Promise<void> {
  while (true) {
    await Promise.all([runCollections(), runSales()]);
  }
}

async function runCollections(): Promise<void> {
  const allCollections = await Collection.findNotFetchedSince(ONE_HOUR);
  const collections = allCollections.filter(
    (collection) => collection.chain === Blockchain.Ethereum
  );

  if (collections.length === 0) {
    console.log("No Collections to request...");
    return;
  }
  console.log("Collections to request:", collections.length);
  const ethInUSD = await Coingecko.getEthPrice();
  for (const collection of collections) {
    try {
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
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          collection.remove();
        }
        if (e.response.status === 429) {
          // Backoff for 1 minute if rate limited
          await sleep(60);
        }
      }
      console.error("Error retrieving collection data:", e.message);
    }
    await sleep(1);
  }
  await Collection.removeDuplicates();
}

async function runSales(): Promise<void> {
  const MAX_INT = 2_147_483_647;
  const ethInUSD = await Coingecko.getEthPrice();
  const collections = await Collection.getSorted(
    "totalVolume",
    "DESC",
    0,
    MAX_INT,
    Blockchain.Ethereum
  );
  console.log("Fetching Sales for collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching Sales for collection:", collection.name);
    await fetchSales(collection, ethInUSD);
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
    slug || fetchedSlug,
    ethInUSD
  );
  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const statisticId = (
    await Collection.findOne(address, { relations: ["statistic"] })
  ).statistic?.id;
  const collection = Collection.create({ address, ...filteredMetadata });
  collection.statistic = Statistic.create({ id: statisticId, ...statistics });
  collection.lastFetched = new Date(Date.now());
  collection.save();
}

async function fetchSales(
  collection: Collection,
  ethInUSD: number
): Promise<void> {
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
        limit,
        ethInUSD
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
              collection: collection,
              marketplace: Marketplace.Opensea,
              ...nextSale,
            }),
          }),
          {}
        );
      Sale.save(Object.values(sales));
      offset += limit;
      await sleep(1);
    } catch (e) {
      console.error("Error retrieving sales data:", e.message);

      if (axios.isAxiosError(e)) {
        if (
          e.response.status === 404 ||
          e.response.status === 500 ||
          e.response.status === 504
        ) {
          console.error("Error retrieving sales data:", e.message);
          return;
        }
        if (e.response.status === 429) {
          // Backoff for 1 minute if rate limited
          await sleep(60);
        }
      }
      continue;
    }
  }
}

const OpenseaAdapter: DataAdapter = { run };
export default OpenseaAdapter;
