import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { Blockchain, LowVolumeError } from "../types";
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
          ...collection
        },
        solInUSD
      );
    } catch (e) {
      if (e instanceof LowVolumeError) {
        console.log("low volume error") // TODO remove collection
      }
      if (axios.isAxiosError(e)) {
        if (e.response.status === 404) {
          console.log("other error") // TODO remove collection
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

async function fetchCollection(
  collection: any, // TODO add type
  solInUSD: number
): Promise<void> {
  const existingCollection = await Collection.findBySlug(collection.slug);

  if (existingCollection) {
    // TODO update statistics
    console.log("collection already exists, called", existingCollection.name)
    return
  }

  const { metadata, statistics } = await MagicEden.getCollection(
    collection,
    solInUSD
  );
  
  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v != null)
  );

  const address = collection.candyMachineIds?.length && collection.candyMachineIds[0]

  if (address) {
    const storedCollection = Collection.create({
      address,
      chain: Blockchain.Solana,
      defaultTokenId: "",
      ...filteredMetadata
    });

    storedCollection.statistic = Statistic.create({...statistics}) as any; //TODO fix
    storedCollection.lastFetched = new Date(Date.now());
    storedCollection.save();
  }
}

async function runSales(): Promise<void> {

}

const MagicEdenAdapter: DataAdapter = { run };
export default MagicEdenAdapter;
