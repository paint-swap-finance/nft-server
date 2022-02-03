import { Block } from "web3-eth";
import { Log } from "web3-core";
import { Marketplace, Blockchain, SaleData } from "../src/types";
import { HistoricalStatistics, Collection, Sale } from "../src/models";
import { CurrencyConverter } from "../src/api/currency-converter";
import { COINGECKO_IDS } from "../src/constants";
import { getSalesFromLogs, getTimestampsInBlockSpread } from "../src/utils";

/* 
Used for manually collecting logs from a contract and inserting them as sales
(an example use case is collecting logs from a deprecated v1 contract).
*/

const parseSalesFromLogs = async ({
  logs,
  oldestBlock,
  newestBlock,
  chain,
  marketplace,
}: {
  logs: Log[];
  oldestBlock: Block;
  newestBlock: Block;
  chain: Blockchain;
  marketplace: Marketplace;
}): Promise<SaleData[]> => {
  if (!logs.length) {
    return [] as SaleData[];
  }

  const timestamps = await getTimestampsInBlockSpread(
    oldestBlock,
    newestBlock,
    COINGECKO_IDS[chain].llamaId
  );

  const parsedLogs = [];
  for (const log of logs) {
    try {
      const { data, blockNumber, transactionHash } = log;
      const buyerAddress = "0x" + data.slice(154, 194);
      const contractAddress = "0x13a65b9f8039e2c032bc022171dc05b30c3f2892";
      const priceWei = Number("0x" + data.slice(66, 130));
      const price = priceWei / Math.pow(10, 18);

      // Get the closest block number in timestamps object
      const dayBlockNumber = Object.keys(timestamps).reduce(
        (a: string, b: string) =>
          Math.abs(parseInt(b) - blockNumber) <
          Math.abs(parseInt(a) - blockNumber)
            ? b
            : a
      );
      const timestamp = timestamps[dayBlockNumber].toString();

      parsedLogs.push({
        txnHash: transactionHash.toLowerCase(),
        paymentTokenAddress: "0x72cb10c6bfa5624dd07ef608027e366bd690048f", //DEFAULT_TOKEN_ADDRESSES[chain],
        contractAddress,
        timestamp,
        sellerAddress: "",
        buyerAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        chain,
        marketplace,
      });
    } catch (e) {
      console.log(e);
      continue;
    }
  }

  return parsedLogs as SaleData[];
};

const main = async ({
  adapterName,
  rpc,
  marketplace,
  chain,
  fromBlock,
  toBlock,
  contractAddress,
  topic,
}: {
  adapterName: string;
  rpc: string;
  marketplace: Marketplace;
  chain: Blockchain;
  fromBlock?: number;
  toBlock?: number;
  contractAddress: string;
  topic: string;
}): Promise<void> => {
  const { data: collections } = await Collection.getSorted({
    marketplace,
  });

  const { sales } = await getSalesFromLogs({
    adapterName,
    rpc,
    fromBlock,
    toBlock,
    contractAddress,
    topic,
    chain,
    marketplace,
    parser: parseSalesFromLogs,
  });

  if (!sales.length) {
    console.log(`No new sales for ${adapterName} collections`);
    return;
  }

  console.log(
    `Matching sales to ${adapterName} collections:`,
    collections.length
  );

  for (const collection of collections) {
    console.log(
      `Matching sales for ${adapterName} collection:`,
      collection.name
    );
    const salesByCollection = sales.filter(
      (sale) => sale.contractAddress === collection.address
    );

    if (!salesByCollection.length) {
      console.log(
        `No sales found for ${adapterName} collection`,
        collection.name
      );
      continue;
    }

    const convertedSales = await CurrencyConverter.convertSales(
      salesByCollection
    );

    const slug = collection.slug;

    const salesInserted = await Sale.insert({
      slug,
      marketplace,
      sales: convertedSales,
    });

    if (salesInserted) {
      console.log("Sales successfully inserted");
      await HistoricalStatistics.updateStatistics({
        slug,
        chain,
        marketplace,
        sales: convertedSales,
      });
      console.log("Historical statistics successfully updated");
    }
  }
};

main({
  adapterName: "Defi Kingdoms",
  rpc: "https://harmony-0-rpc.gateway.pokt.network",
  topic: "0xe40da2ed231723b222a7ba7da994c3afc3f83a51da76262083e38841e2da0982",
  contractAddress: "0x13a65b9f8039e2c032bc022171dc05b30c3f2892",
  fromBlock: 21950000,
  marketplace: Marketplace.DefiKingdoms,
  chain: Blockchain.Harmony,
});
