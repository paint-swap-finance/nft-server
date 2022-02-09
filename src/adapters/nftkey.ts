import { DataAdapter } from ".";
import {
  Collection,
  Sale,
  HistoricalStatistics,
  AdapterState,
} from "../models";
import { Blockchain, CollectionData, Marketplace } from "../types";
import { NFTKEY, NFTKEYCollectionData } from "../api/nftkey";
import { Coingecko } from "../api/coingecko";
import { CurrencyConverter } from "../api/currency-converter";
import { sleep, handleError, filterObject, getSalesFromLogs } from "../utils";
import { CHAIN_IDS, COINGECKO_IDS } from "../constants";

const adapterChains = [
  Blockchain.Harmony,
  Blockchain.Fantom,
  Blockchain.Ethereum,
  Blockchain.Avalanche,
  Blockchain.BSC,
];

async function runCollections(): Promise<void> {
  const collections = await NFTKEY.getAllCollections();
  const prices: Partial<Record<Blockchain, number>> = {};

  for (const chain of adapterChains) {
    const { usd } = await Coingecko.getPricesById(COINGECKO_IDS[chain].geckoId);
    prices[chain] = usd;
  }

  console.log("Fetching metadata for NFTKEY collections:", collections.length);
  for (const collection of collections) {
    try {
      console.log("Fetching metadata for NFTKEY collection:", collection.name);
      await fetchCollection(collection, prices);
    } catch (e) {
      await handleError(e, "nftkey-adapter:runCollections");
    }
  }
}

// async function runSales(): Promise<void> {
//   const { data: collections } = await Collection.getSorted({
//     marketplace: Marketplace.NFTKEY,
//   });

//   if (!collections.length) {
//     return;
//   }

//   let adapterState = await AdapterState.getSalesAdapterState(
//     Marketplace.NFTKEY
//   );

//   if (!adapterState) {
//     adapterState = await AdapterState.createSalesAdapterState(
//       Marketplace.NFTKEY
//     );
//   }

//   const { lastSyncedBlockNumber } = adapterState;

//   console.log(
//     "Fetching sales for NFTKEY collections from block number",
//     lastSyncedBlockNumber
//   );

//   await fetchSales(collections, parseInt(lastSyncedBlockNumber));
// }

async function fetchCollection(
  collection: NFTKEYCollectionData,
  prices: Partial<Record<Blockchain, number>>
): Promise<void> {
  const chain = CHAIN_IDS[collection.chain_id]
  const price = prices[chain]

  const { metadata, statistics } = await NFTKEY.getCollection(
    collection,
    price
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
    chain,
    marketplace: Marketplace.NFTKEY,
  });
}

// async function fetchSales(
//   collections: Collection[],
//   lastSyncedBlockNumber: number
// ): Promise<void> {
//   try {
//     const { sales, latestBlock } = await getSalesFromLogs({
//       adapterName: "NFTKEY",
//       rpc: "https://api.avax.network/ext/bc/C/rpc",
//       topic:
//         "0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5",
//       contractAddress: "0xcFB6Ee27d82beb1B0f3aD501B968F01CD7Cc5961",
//       fromBlock: lastSyncedBlockNumber,
//       marketplace: Marketplace.NFTKEY,
//       chain: Blockchain.Avalanche,
//       parser: NFTKEY.parseSalesFromLogs,
//     });

//     if (!sales.length) {
//       console.log("No new sales for NFTKEY collections");
//       return;
//     }

//     console.log("Matching sales to NFTKEY collections:", collections.length);
//     for (const collection of collections) {
//       console.log("Matching sales for NFTKEY collection:", collection.name);
//       const salesByCollection = sales.filter(
//         (sale) => sale.contractAddress === collection.address
//       );

//       if (!salesByCollection.length) {
//         console.log("No sales found for NFTKEY collection", collection.name);
//         continue;
//       }

//       const convertedSales = await CurrencyConverter.convertSales(
//         salesByCollection
//       );

//       const slug = collection.slug;
//       const salesInserted = await Sale.insert({
//         slug,
//         marketplace: Marketplace.NFTKEY,
//         sales: convertedSales,
//       });

//       if (salesInserted) {
//         await HistoricalStatistics.updateStatistics({
//           slug,
//           chain: Blockchain.Avalanche,
//           marketplace: Marketplace.NFTKEY,
//           sales: convertedSales,
//         });
//         await AdapterState.updateSalesLastSyncedBlockNumber(
//           Marketplace.NFTKEY,
//           latestBlock
//         );
//       }
//     }
//   } catch (e) {
//     await handleError(e, "nftkey-adapter:fetchSales");
//   }
// }

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([
        runCollections(),
        // runSales([Blockchain.Avalanche])
      ]);
      await sleep(60 * 60);
    }
  } catch (e) {
    await handleError(e, "nftkey-adapter");
  }
}

const NFTKEYAdapter: DataAdapter = { run };

NFTKEYAdapter.run();

export default NFTKEYAdapter;
