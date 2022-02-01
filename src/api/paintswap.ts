/* eslint-disable camelcase */

import axios from "axios";
import web3 from "web3";
import { Log } from "web3-core";

import { convertByDecimals, getSlug, roundUSD } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import { Blockchain, CollectionAndStatisticData, Marketplace } from "../types";
import { HistoricalStatistics } from "../models";

export interface PaintSwapCollectionData {
  id: string;
  createdAt: string;
  updatedAt: string;
  address: string;
  owner: string;
  name: string;
  description: string;
  nsfw: boolean;
  mintPriceLow: number;
  mintPriceHigh: number;
  verified: boolean;
  startBlock?: number;
  website: string;
  twitter: string;
  discord: string;
  medium: string;
  telegram: string;
  reddit: string;
  poster: string;
  banner: string;
  thumbnail: string;
  standard: string;
  featured: boolean;
  displayed: boolean;
  imageStyle?: string;
  customMetadata?: string;
  stats: PaintSwapCollectionStats;
}

interface PaintSwapCollectionStats {
  averagePrice: string;
  floor: string;
  floorFTM: string;
  id: string;
  lastSellPrice: string;
  lastSellPriceFTM: string;
  totalNFTs: string;
  totalVolumeTraded: string;
  totalVolumeTradedFTM: string;
  floorCap: string;
  sale: Object;
}

export class PaintSwap {
  public static async getAllCollections(): Promise<PaintSwapCollectionData[]> {
    const url = `https://api.paintswap.finance/v2/collections?sortByRecentVolume=true`;
    const response = await axios.get(url);
    const { collections } = response.data;

    return collections;
  }

  public static async getCollection(
    collection: PaintSwapCollectionData,
    ftmInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const {
      name,
      address,
      description,
      website,
      twitter: twitter_username,
      discord: discord_url,
      telegram: telegram_url,
      thumbnail: logo,
      stats,
    } = collection;

    const { floorFTM, floorCap } = stats;
    const floor = convertByDecimals(parseInt(floorFTM), 18) || 0;
    const marketCap = convertByDecimals(parseInt(floorCap), 18) || 0;
    const slug = getSlug(name);

    const { totalVolume, totalVolumeUSD } =
      await HistoricalStatistics.getCollectionTotalVolume({
        slug,
        marketplace: Marketplace.PaintSwap,
      });

    const { dailyVolume, dailyVolumeUSD } =
      await HistoricalStatistics.getCollectionDailyVolume({
        slug,
        marketplace: Marketplace.PaintSwap,
      });

    return {
      metadata: {
        address,
        name,
        slug,
        description,
        logo,
        symbol: null,
        website,
        discord_url,
        telegram_url,
        twitter_username,
        medium_username: null,
        chains: [Blockchain.Fantom],
        marketplaces: [Marketplace.PaintSwap],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD,
        owners: 0,
        floor,
        floorUSD: roundUSD(floor * ftmInUSD),
        totalVolume,
        totalVolumeUSD,
        marketCap,
        marketCapUSD: roundUSD(marketCap * ftmInUSD),
      },
    };
  }

  public static async getSales(lastSyncedBlockNumber: number) {
    const provider = new web3("https://rpc.ftm.tools");
    const latestBlock = await provider.eth.getBlockNumber();

    const params = {
      fromBlock: lastSyncedBlockNumber,
      toBlock: latestBlock,
    };

    let logs = [] as Log[];
    let blockSpread = params.toBlock - params.fromBlock;
    let currentBlock = params.fromBlock;
    while (currentBlock < params.toBlock) {
      const nextBlock = Math.min(params.toBlock, currentBlock + blockSpread);
      try {
        const partLogs = await provider.eth.getPastLogs({
          fromBlock: currentBlock,
          toBlock: nextBlock,
          address: "0x6125fd14b6790d5f66509b7aa53274c93dae70b9",
          topics: [
            "0x0cda439d506dbc3b73fe10f062cf285c4e75fe85d310decf4b8239841879ed61",
          ],
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
        const sellerAddress = "0x" + data.slice(410, 450);
        const buyerAddress = "0x" + data.slice(346, 386);
        const contractAddress = "0x" + data.slice(602, 642);
        const priceWei = Number("0x" + data.slice(258, 322));
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
          paymentTokenAddress: DEFAULT_TOKEN_ADDRESSES[Blockchain.Fantom],
          timestamp,
          sellerAddress,
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

    return { sales: parsedLogs, latestBlock };
  }
}
