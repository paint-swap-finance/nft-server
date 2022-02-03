/* eslint-disable camelcase */

import axios from "axios";
import web3 from "web3";
import { Block } from "web3-eth";
import { Log } from "web3-core";

import { getSlug, getTimestampsInBlockSpread } from "../utils";
import { COINGECKO_IDS, DEFAULT_TOKEN_ADDRESSES } from "../constants";
import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
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

  public static async parseSalesFromLogs({
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
  }): Promise<SaleData[]> {
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
        const { topics, data, blockNumber, transactionHash } = log;
        const sellerAddress = "0x" + topics[1].slice(26);
        const buyerAddress = "0x" + data.slice(282, 322);
        const contractAddress = "0x" + data.slice(802, 842);
        const priceWei = Number("0x" + data.slice(450, 514));
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
          paymentTokenAddress: DEFAULT_TOKEN_ADDRESSES[chain],
          timestamp,
          sellerAddress,
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

    return parsedLogs as SaleData[];
  }
}
