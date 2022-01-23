import axios from "axios";
import web3 from "web3";
import { HistoricalStatistics } from "../models";

import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { COINGECKO_IDS } from "../constants";
import {
  convertByDecimals,
  roundUSD,
  getTimestampsInBlockSpread,
} from "../utils";

export interface DefiKingdomsCollectionData {
  floorPrice: string;
  totalListings: string;
  totalVolume: string;
}

export interface DefiKingdomsTransactionBuyerSeller {
  id: string;
}

export interface DefiKingdomsTransactionData {
  blockTimestamp: string;
  buyer: DefiKingdomsTransactionBuyerSeller;
  seller: DefiKingdomsTransactionBuyerSeller;
  pricePerItem: string;
  quantity: string;
  transactionLink: string;
}

export class DefiKingdoms {
  public static async getCollection(
    collection: any,
    jewelInUsd: number,
    jewelInOne: number
  ): Promise<CollectionAndStatisticData> {
    const address = collection.address.toLowerCase();
    const { name, slug } = collection;

    const { totalVolume, totalVolumeUSD } =
      await HistoricalStatistics.getCollectionTotalVolume({
        slug,
        marketplace: Marketplace.DefiKingdoms,
      });

    const { dailyVolume, dailyVolumeUSD } =
      await HistoricalStatistics.getCollectionDailyVolume({
        slug,
        marketplace: Marketplace.DefiKingdoms,
      });

    const response = await axios.post(
      "https://us-central1-defi-kingdoms-api.cloudfunctions.net/query_heroes",
      {
        limit: 1,
        offset: 0,
        order: {
          orderBy: "saleprice",
          orderDir: "asc",
        },
        params: [
          {
            field: "saleprice",
            operator: ">=",
            value: "1000000000000000000",
          },
        ],
      }
    );

    const floorHero = (response.data &&
      response.data.length &&
      response.data[0]) || {
      saleprice: 0,
    };
    const { saleprice: floorRaw } = floorHero;
    const floor = convertByDecimals(parseInt(floorRaw), 18);

    return {
      metadata: {
        address,
        name,
        slug,
        symbol: null,
        description: null,
        logo: "https://icons.llama.fi/defi-kingdoms.png",
        website: "https://defikingdoms.com/",
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: null,
        chains: [Blockchain.Harmony],
        marketplaces: [Marketplace.DefiKingdoms],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD,
        owners: 0,
        floor: floor * jewelInOne,
        floorUSD: roundUSD(floor * jewelInUsd),
        totalVolume,
        totalVolumeUSD,
        marketCap: 0,
        marketCapUSD: 0,
      },
    };
  }

  public static async parseSalesFromLogs({
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
  }) {
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
  }

  public static async getSales({
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
  }): Promise<any | undefined> {
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
        
        if (logs.length >= 100000) {
          // Get 100k logs at a time
          break
        }
      } catch (e) {
        if (blockSpread >= 100) {
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

    const { sales } = await DefiKingdoms.parseSalesFromLogs({
      logs,
      oldestBlock,
      newestBlock,
      chain,
      marketplace,
    });

    return {
      sales,
      latestBlock: params.toBlock,
    };
  }
}
