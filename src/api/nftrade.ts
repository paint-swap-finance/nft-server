/* eslint-disable camelcase */

import axios from "axios";
import web3 from "web3";
import { getSlug } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import { Blockchain, CollectionAndStatisticData, Marketplace } from "../types";
import { HistoricalStatistics } from "../models";

export interface NFTradeCollectionData {
  id: string;
  address: string;
  name: string;
  symbol: string;
  chainId: number;
  chainType: string;
  verified: boolean;
  forked: boolean;
  trending: boolean;
  hot: boolean;
  ai_generated: boolean;
  handmade: boolean;
  error: boolean;
  partial_royalty_support: boolean;
  full_royalty_support: boolean;
  image: string;
  cover_image: string;
  description: string;
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
  telegramBotChatId?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export class NFTrade {
  public static async getAllCollections(): Promise<NFTradeCollectionData[]> {
    const url = `https://api.nftrade.com/api/v1/contracts?limit=1000&skip=0&verified=true`;
    const response = await axios.get(url);
    const collections = response.data;

    return collections.filter(
      (collection: NFTradeCollectionData) => collection.chainId === 43114
    );
  }

  public static async getCollection(
    collection: NFTradeCollectionData,
    avaxInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const {
      name,
      address,
      symbol,
      description,
      twitter,
      website,
      discord: discord_url,
      telegram: telegram_url,
      image: logo,
    } = collection;
    const slug = getSlug(name);

    const { totalVolume, totalVolumeUSD } =
      await HistoricalStatistics.getCollectionTotalVolume({
        slug,
        marketplace: Marketplace.NFTrade,
      });

    const { dailyVolume, dailyVolumeUSD } =
      await HistoricalStatistics.getCollectionDailyVolume({
        slug,
        marketplace: Marketplace.NFTrade,
      });

    const twitter_username = twitter ? twitter.split("/").slice(-1)[0] : null;

    return {
      metadata: {
        address,
        name,
        slug,
        description,
        logo,
        symbol,
        website,
        discord_url,
        telegram_url,
        twitter_username,
        medium_username: null,
        chains: [Blockchain.Avalanche],
        marketplaces: [Marketplace.NFTrade],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD,
        owners: 0,
        floor: 0,
        floorUSD: 0,
        totalVolume,
        totalVolumeUSD,
        marketCap: 0,
        marketCapUSD: 0,
      },
    };
  }

  public static async getSales(lastSyncedBlockNumber: number) {
    const provider = new web3("https://api.avax.network/ext/bc/C/rpc");
    const latestBlock = await provider.eth.getBlockNumber();

    const params = {
      fromBlock: lastSyncedBlockNumber,
      toBlock: latestBlock,
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
          address: "0xcFB6Ee27d82beb1B0f3aD501B968F01CD7Cc5961",
          topics: [
            "0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5",
          ],
        });
        console.log(
          `Fetched sales for NFTrade collections from block number ${currentBlock} --> ${nextBlock}`
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
        latestBlock,
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
          `https://coins.llama.fi/block/avax/${Math.floor(timestamp / 1000)}`
        );
        const { height } = response.data;
        timestamps[height] = timestamp;
      }
    }

    const parsedLogs = [];
    for (const log of logs) {
      try {
        const { topics, data, blockNumber, transactionHash } = log;
        const sellerAddress = "0x" + topics[1].slice(26);
        const buyerAddress = "0x" + data.slice(282, 322);
        const contractAddress = "0x" + data.slice(802, 842);
        const priceWei = Number("0x" + data.slice(450, 514));
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
          paymentTokenAddress: DEFAULT_TOKEN_ADDRESSES[Blockchain.Avalanche],
          timestamp,
          sellerAddress,
          buyerAddress,
          contractAddress,
          price,
          priceBase: 0,
          priceUSD: 0,
          chain: Blockchain.Avalanche,
          marketplace: Marketplace.NFTrade,
        });
      } catch (e) {
        console.log(e);
        continue;
      }
    }

    return { sales: parsedLogs, latestBlock };
  }
}
