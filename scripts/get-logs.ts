import web3 from "web3";
import axios from "axios";
import { Marketplace, Blockchain } from "../src/types";
import { HistoricalStatistics, Collection, Sale } from "../src/models";
import { CurrencyConverter } from "../src/api/currency-converter";
import { COINGECKO_IDS, DEFAULT_TOKEN_ADDRESSES } from "../src/constants";

/* 
Used for manually collecting logs from a contract and inserting them as sales
(an example use case is collecting logs from a deprecated v1 contract).
*/

const getTimestampsInBlockSpread = async (
  oldestBlock: any,
  newestBlock: any,
  llamaId: string
) => {
  const oldestTimestamp = new Date(
    (oldestBlock.timestamp as number) * 1000
  ).setUTCHours(0, 0, 0, 0);
  const newestTimestamp = new Date(
    (newestBlock.timestamp as number) * 1000
  ).setUTCHours(0, 0, 0, 0);

  const timestamps: Record<string, number> = {};

  for (
    let timestamp = oldestTimestamp;
    timestamp <= newestTimestamp;
    timestamp += 86400 * 1000
  ) {
    if (timestamp) {
      const response = await axios.get(
        `https://coins.llama.fi/block/${llamaId}/${Math.floor(
          timestamp / 1000
        )}`
      );
      const { height } = response.data;
      timestamps[height] = timestamp;
    }
  }
  return timestamps;
};

const parseSalesFromLogs = async ({
  logs,
  oldestBlock,
  newestBlock,
  chain,
  marketplace,
}: {
  logs: any[];
  oldestBlock: any;
  newestBlock: any;
  chain: Blockchain;
  marketplace: Marketplace;
}) => {
  if (!logs.length) {
    return {
      sales: [] as any[],
    };
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
          Math.abs(parseInt(b) - parseInt(blockNumber)) <
          Math.abs(parseInt(a) - parseInt(blockNumber))
            ? b
            : a
      );
      const timestamp = timestamps[dayBlockNumber].toString();

      parsedLogs.push({
        txnHash: transactionHash.toLowerCase(),
        paymentTokenAddress: "0x72cb10c6bfa5624dd07ef608027e366bd690048f", //DEFAULT_TOKEN_ADDRESSES[chain],
        timestamp,
        sellerAddress: "",
        buyerAddress,
        contractAddress,
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

  return {
    sales: parsedLogs as any[],
  };
};

const getSales = async ({
  rpc,
  topic,
  contractAddress,
  adapterName,
  chain,
  marketplace,
  fromBlock,
  toBlock,
}: {
  rpc: string;
  topic: string;
  contractAddress: string;
  chain: Blockchain;
  marketplace: Marketplace;
  adapterName?: string;
  fromBlock?: number;
  toBlock?: number;
}) => {
  const provider = new web3(rpc);
  const latestBlock = await provider.eth.getBlockNumber();

  const params = {
    fromBlock: fromBlock || 0,
    toBlock: toBlock || latestBlock,
  };

  let logs = [] as any;
  let blockSpread = params.toBlock - params.fromBlock;
  let currentBlock = params.fromBlock;

  while (currentBlock < params.toBlock) {
    const nextBlock = Math.min(params.toBlock, currentBlock + blockSpread);
    try {
      const partLogs = await provider.eth.getPastLogs({
        fromBlock: currentBlock,
        toBlock: nextBlock,
        address: contractAddress,
        topics: [topic],
      });

      console.log(
        `Fetched sales for ${adapterName} from block number ${currentBlock} --> ${nextBlock}`
      );

      logs = logs.concat(partLogs);
      currentBlock = nextBlock;
    } catch (e) {
      if (blockSpread >= 1000) {
        // We got too many results
        // We could chop it up into 2K block spreads as that is guaranteed to always return but then we'll have to make a lot of queries (easily >1000), so instead we'll keep dividing the block spread by two until we make it
        blockSpread = Math.floor(blockSpread / 2);
      } else {
        throw e;
      }
    }
  }

  const oldestBlock = await provider.eth.getBlock(logs[0].blockNumber);
  const newestBlock = await provider.eth.getBlock(
    logs.slice(-1)[0].blockNumber
  );

  const { sales } = await parseSalesFromLogs({
    logs,
    oldestBlock,
    newestBlock,
    chain,
    marketplace,
  });

  return {
    sales
  }
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
}) => {
  const { data: collections } = await Collection.getSorted({
    marketplace,
  });

  const { sales } = await getSales({
    adapterName,
    rpc,
    fromBlock,
    toBlock,
    contractAddress,
    topic,
    chain,
    marketplace,
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
      console.log("Sales successfully inserted")
      await HistoricalStatistics.updateStatistics({
        slug,
        chain,
        marketplace,
        sales: convertedSales,
      });
      console.log("Historical statistics successfully updated")
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
