import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Sale } from "../models/sale";
import { Blockchain, LowVolumeError, Marketplace } from "../types";
import { MagicEden } from "../api/magic-eden";
import { Coingecko } from "../api/coingecko";
import { sleep } from "../utils";
import axios from "axios";

async function run(): Promise<void> {
  while (true) {
    await Promise.all([runCollections(), runSales()]);
    await sleep(60 * 30);
  }
}

async function runCollections(): Promise<void> {
  const collections = await MagicEden.getAllCollections();

  console.log("Collections to request:", collections.length);

  const solInUSD = await Coingecko.getSolPrice();

  for (const collection of collections) {
    try {
      await fetchCollection(
        {
          slug: collection.symbol,
          ...collection,
        },
        solInUSD
      );
    } catch (e) {
      if (e instanceof LowVolumeError) {
        console.log("low volume error"); // TODO remove collection
      }
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          console.log("other error"); // TODO remove collection
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
  const collections = await Collection.getSorted(
    "totalVolume",
    "DESC",
    0,
    MAX_INT,
    Blockchain.Solana
  );
  console.log("Fetching Sales for collections:", collections.length);
  for (const collection of collections) {
    console.log("Fetching Sales for collection:", collection.name);
    await fetchSales(collection);
  }
}

async function fetchCollection(
  collection: any, // TODO add type
  solInUSD: number
): Promise<void> {
  const existingCollection = await Collection.findBySlug(collection.slug);

  if (existingCollection) {
    // TODO update statistics
    console.log("collection already exists, called", existingCollection.name);
    return;
  }

  const { metadata, statistics } = await MagicEden.getCollection(
    collection,
    solInUSD
  );

  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const address =
    collection.candyMachineIds?.length && collection.candyMachineIds[0];

  if (address) {
    const storedCollection = Collection.create({
      address,
      chain: Blockchain.Solana,
      defaultTokenId: "",
      ...filteredMetadata,
    });

    storedCollection.statistic = Statistic.create({ ...statistics }) as any; //TODO fix
    storedCollection.lastFetched = new Date(Date.now());
    storedCollection.save();
  }
}

async function fetchSales(collection: Collection): Promise<void> {
  const mostRecentSaleTime =
    (await collection.getLastSale(Marketplace.MagicEden))?.timestamp?.getTime() || 0; 
  try {
    const salesEvents = await MagicEden.getSales(collection, mostRecentSaleTime);
    
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
            marketplace: Marketplace.MagicEden,
            ...nextSale,
          }),
        }),
        {}
      );

    Sale.save(Object.values(sales));
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
  }
}

const MagicEdenAdapter: DataAdapter = { run };
export default MagicEdenAdapter;
