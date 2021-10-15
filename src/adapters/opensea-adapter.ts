import axios from "axios";
import { Opensea } from "../api/opensea";
import { DataAdapter } from ".";
import { Collection } from "../models/collection";
import { Statistic } from "../models/statistic";
import { sleep } from "../utils";
import { Coingecko } from "../api/coingecko";

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

async function run(): Promise<void> {
  while(true) {
    const collections = await Collection.findNotFetched();
    if (collections.length === 0) {
      console.log("No Collections to request. Sleeping for 60 seconds...");
      await sleep(60);
      continue;
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
        }
        console.log("Error retrieving collection data:", e.message);
      }
      await sleep(1);
    }
    console.log("Waiting 30 mins before requesting Opensea...")
    await sleep(30*60);
  }
}

const OpenseaAdapter: DataAdapter = { run };
export default OpenseaAdapter;