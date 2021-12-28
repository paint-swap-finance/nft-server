import { Blockchain, Marketplace } from "../src/types";
import { Collection } from "../src/models";

// Example (Treasure collections)
const collections = [
  {
    address: "",
    slug: "",
    chain: Blockchain.Arbitrum,
    marketplace: Marketplace.Treasure,
    name: "",
    symbol: "",
    description: "",
    logo: "",
    website: "",
    totalVolumeUSD: 0,
  },
];

const main = async () => {
  try {
    console.log("Manually inserting", collections.length, "collections");
    for (const collection of collections) {
      console.log("Inserting collection", collection.name);
      const { slug, chain, marketplace, totalVolumeUSD, ...metadata } =
        collection;
      await Collection.upsert({
        slug,
        metadata,
        chain,
        marketplace,
        statistics: { totalVolumeUSD },
      });
    }
    return "Successfully inserted collections";
  } catch (e) {
    console.log(e.message);
    return "Error inserting collections";
  }
};

main().then((result) => console.log(result));
