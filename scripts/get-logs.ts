import web3 from "web3";
import axios from "axios";
import { Marketplace, Blockchain } from "../src/types";
import { HistoricalStatistics, Collection, Sale } from "../src/models";
import { CurrencyConverter } from "../src/api/currency-converter";

/* 
Used for manually collecting logs from a contract and inserting them as sales
(an example use case is collecting logs from a deprecated v1 contract).
*/

const getSales = async (
  fromBlockNumber: number,
  contract: string,
  topic: string
) => {
  const provider = new web3("https://rpc.ftm.tools");

  const params = {
    fromBlock: fromBlockNumber,
    toBlock: 21068464,
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
        address: contract,
        topics: [topic],
      });
      console.log(
        `Fetched sales for PaintSwap collections from block number ${currentBlock} --> ${nextBlock}`
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

  if (!logs.length) {
    return {
      sales: [],
    };
  }

  const oldestBlock = await provider.eth.getBlock(logs[0].blockNumber);
  const newestBlock = await provider.eth.getBlock(
    logs.slice(-1)[0].blockNumber
  );
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
        `https://coins.llama.fi/block/fantom/${Math.floor(timestamp / 1000)}`
      );
      const { height } = response.data;
      timestamps[height] = timestamp;
    }
  }

  const parsedLogs = [];
  for (const log of logs) {
    try {
      const { data, blockNumber, transactionHash } = log;
      const buyerAddress = "0x" + data.slice(346, 386);
      const contractAddress = "0x" + data.slice(538, 578);
      const priceWei = Number("0x" + data.slice(258, 322));
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
        paymentTokenAddress: "0x85dec8c4b2680793661bca91a8f129607571863d",
        timestamp,
        sellerAddress: "",
        buyerAddress,
        contractAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        chain: Blockchain.Fantom,
        marketplace: Marketplace.PaintSwap,
      });
    } catch (e) {
      console.log(e);
      continue;
    }
  }

  return { sales: parsedLogs };
};

const main = async (
  marketplace: Marketplace,
  chain: Blockchain,
  fromBlockNumber: number,
  contract: string,
  topic: string
) => {
  const { data: collections } = await Collection.getSorted({
    marketplace,
  });

  const { sales } = await getSales(fromBlockNumber, contract, topic);

  if (!sales.length) {
    console.log("No new sales for PaintSwap collections");
    return;
  }

  console.log("Matching sales to PaintSwap collections:", collections.length);
  for (const collection of collections) {
    console.log("Matching sales for PaintSwap collection:", collection.name);
    const salesByCollection = sales.filter(
      (sale) => sale.contractAddress === collection.address
    );

    if (!salesByCollection.length) {
      console.log("No sales found for PaintSwap collection", collection.name);
      continue;
    }

    const convertedSales = await CurrencyConverter.convertSales(
      salesByCollection
    );

    const slug = collection.slug;

    const salesInserted = await Sale.insert({
      slug,
      marketplace: Marketplace.PaintSwap,
      sales: convertedSales,
    });

    if (salesInserted) {
      await HistoricalStatistics.updateStatistics({
        slug,
        chain,
        marketplace,
        sales: convertedSales,
      });
    }
  }

  return "Successfully inserted sales"
};

main(
  Marketplace.PaintSwap,
  Blockchain.Fantom,
  16077924,
  "0xf65e2f2a434ef34768ed07643f680850ad1b03bb",
  "0x71247f9fb0782c91364854ddddd648237f90f4a938c351eb014d84759823649b"
).then((result) => console.log(result));
