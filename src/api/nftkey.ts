/* eslint-disable camelcase */

import axios from "axios";
import web3 from "web3";
import { Block } from "web3-eth";
import { Log } from "web3-core";

import { getSlug, getTimestampsInBlockSpread, roundUSD } from "../utils";
import { COINGECKO_IDS, DEFAULT_TOKEN_ADDRESSES } from "../constants";
import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { HistoricalStatistics } from "../models";

export interface NFTKEYCollectionData {
  name: string;
  address: string;
  chain_id: number;
  website_url: string;
  description: string;
  link: string;
  floor: number;
  thumbnail_url: string;
  max_supply: number;
  total_supply: number;
  total_volume: number;
  last_24h_volume: number;
  last_7d_volume: number;
  last_30d_volume: number;
}

export class NFTKEY {
  public static async getAllCollections(): Promise<NFTKEYCollectionData[]> {
    const url = `https://nftkey.app/collection-api/collections`;
    const response = await axios.get(url);
    const collections = response.data;

    return collections;
  }

  public static async getCollection(
    collection: NFTKEYCollectionData,
    avaxInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const {
      name,
      address,
      description,
      floor,
      total_supply,
      website_url: website,
      thumbnail_url: logo,
    } = collection;
    const slug = getSlug(name);

    const { totalVolume, totalVolumeUSD } =
      await HistoricalStatistics.getCollectionTotalVolume({
        slug,
        marketplace: Marketplace.NFTKEY,
      });

    const { dailyVolume, dailyVolumeUSD } =
      await HistoricalStatistics.getCollectionDailyVolume({
        slug,
        marketplace: Marketplace.NFTKEY,
      });

    const marketCap = floor * total_supply;

    return {
      metadata: {
        address,
        name,
        slug,
        description,
        logo,
        symbol: null,
        website,
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: null,
        chains: [Blockchain.Avalanche],
        marketplaces: [Marketplace.NFTKEY],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD,
        owners: 0,
        floor,
        floorUSD: roundUSD(floor * avaxInUSD),
        totalVolume,
        totalVolumeUSD,
        marketCap,
        marketCapUSD: roundUSD(marketCap * avaxInUSD),
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
