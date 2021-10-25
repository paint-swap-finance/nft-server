import axios from "axios";
import { Opensea } from "../api/opensea";
import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Sale } from "../models/sale";
import { Statistic } from "../models/statistic";
import { sleep } from "../utils";
import { Coingecko } from "../api/coingecko";
import { Marketplace } from "../types";

async function run(): Promise<void> {
  await Collection.removeDuplicates();
  while (true) {
    await runSales();
    await runCollections();
  }
}

async function runCollections(): Promise<void> {
  const collections = await Collection.findNotFetched();
  if (collections.length === 0) {
    console.log("No Collections to request. Sleeping for 60 seconds...");
    return;
  }
  console.log("Collections to request:", collections.length);
  const ethInUSD = await Coingecko.getEthPrice();
  for (const collection of collections) {
    try {
      await fetchCollection(collection.address, collection.defaultTokenId, ethInUSD);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          collection.lastFetched = new Date(Date.now());
          collection.save();
        }
        if (e.response.status === 429) {
          // Backoff for 1 minute if rate limited
          await sleep(60);
        }
      }
      console.log("Error retrieving collection data:", e.message);
    }
    await sleep(1);
  }
}

async function runSales(): Promise<void> {
  const MAX_INT = 2_147_483_647;
  const collections = await Collection.getSorted("totalVolume", "DESC", 0, MAX_INT);
  console.log("Fetching Sales for collections:", collections.length)
  let skip = true;
  for (const collection of collections) {
    if (skip && collection.slug !== 'hashmasks') {
      continue;
    }
    skip = false;
    console.log("Fetching Sales for collection:", collection.name)
    await fetchSales(collection);
  }
}

async function fetchCollection(address: string, tokenId: string, ethInUSD: number) {
  // console.log("Calling Opensea API for", address, tokenId);
  const { metadata, stats } = await Opensea.getCollection(address, tokenId, ethInUSD);
  const filteredMetadata = Object.fromEntries(Object.entries(metadata).filter(([_, v]) => v != null));

  const statisticId = (await Collection.findOne(address, { relations: ["statistic"] })).statistic?.id;
  const collection = Collection.create({ address, ...filteredMetadata });
  collection.statistic = Statistic.create({ id: statisticId, ...stats });
  collection.lastFetched = new Date(Date.now());
  collection.save();
}

async function fetchSales(collection: Collection): Promise<void> {
  let offset = 0;
  const limit = 100;
  while(offset <= 10000) {
    try {
      const salesEvents = await Opensea.getSales(collection.address, offset, limit);
      const sales = salesEvents.filter(event => event !== undefined).reduce((allSales, nextSale) => ({
        ...allSales,
        [nextSale.txnHash]: Sale.create({
          collection: collection,
          marketplace: Marketplace.Opensea,
          ...nextSale,
        })
      }), {});
      Sale.save(Object.values(sales));
      offset += limit;
      await sleep(1);
    } catch (e) {
      console.log("Error retrieving sales data:", e.message);
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404 || e.response.status === 500 || e.response.status === 504) {
          console.log("Error retrieving sales data:", e.message);
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