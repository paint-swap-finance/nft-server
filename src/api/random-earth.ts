/* eslint-disable camelcase */
import axios from "axios";
import { formatUSD, roundUSD, convertByDecimals, getSlug } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import { Blockchain, CollectionAndStatisticData, SaleData } from "../types";
import { Collection } from "../models/collection";

interface MagicEdenParsedTransaction {
  txType: string;
  transaction_id: string;
  blockTime: number;
  slot: number;
  collection_symbol: string;
  mint: string;
  total_amount: number;
  platform_fees_amount: number;
  seller_fee_amount: number;
  creator_fees_amount: number;
  seller_address: string;
  buyer_address: string;
}

interface MagicEdenTransactionData {
  _id: string;
  transaction_id: string;
  blockTime: number;
  buyer_address: string;
  collection_symbol: string;
  createdAt: string;
  mint: string;
  seller_address: string;
  slot: number;
  source: string;
  txType: string;
  parsedTransaction: MagicEdenParsedTransaction;
}

export interface RandomEarthCollectionData {
  addr: string;
  average_price: number;
  banner_src: string;
  created_at: string;
  description: string;
  floor_price: number;
  items_count: number;
  name: string;
  owners_count: number;
  slug?: string;
  src: string;
  status: string;
  symbol?: string;
  trait_map: Object;
  type: string;
  volume: number;
}

export class RandomEarth {
  public static async getAllCollections(): Promise<
    RandomEarthCollectionData[]
  > {
    const url = `https://randomearth.io/api/collections?page=1`; //TODO iterate through pages once collections grow
    const response = await axios.get(url);
    const { collections } = response.data;

    return collections;
  }

  public static async getCollection(
    collection: RandomEarthCollectionData,
    lunaInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const {
      name,
      addr,
      src: logo,
      description,
      floor_price,
      volume,
      owners_count: owners,
      items_count,
    } = collection;

    const address = addr.toLowerCase();

    const { totalVolume } = await Collection.getTotalVolume(address);

    const slug = getSlug(name);
    const floor = convertByDecimals(floor_price, 6) || 0;
    const dailyVolume = convertByDecimals(volume, 6) || 0;
    const marketCap = items_count * floor || 0;
    const website = address
      ? `https://randomearth.io/collections/${address}`
      : "";

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
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD: formatUSD(dailyVolume * lunaInUSD),
        owners,
        floor,
        floorUSD: roundUSD(floor * lunaInUSD),
        totalVolume: totalVolume ?? 0,
        totalVolumeUSD: formatUSD(totalVolume ?? 0 * lunaInUSD),
        marketCap,
        marketCapUSD: formatUSD(marketCap * lunaInUSD),
      },
    };
  }

  public static async getSales(
    collection: Collection,
    occurredAfter: number
  ): Promise<(SaleData | undefined)[]> {
    return;
    /*
    const url = `https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"collection_symbol":"${collection.slug}"}}`;
    const response = await axios.get(url);
    const results = response.data?.results;

    if (!results) {
      return [];
    }

    return response.data.results.map((sale: MagicEdenTransactionData) => {
      if (sale.txType !== "exchange") {
        return undefined;
      }
      if (new Date(sale.createdAt).getTime() < occurredAfter) {
        return undefined;
      }

      const paymentTokenAddress = DEFAULT_TOKEN_ADDRESSES[Blockchain.Solana];
      const { transaction_id: txnHash, createdAt: timestamp } = sale;
      const {
        total_amount: total_price,
        buyer_address,
        seller_address,
      } = sale.parsedTransaction;

      const price = convertByDecimals(total_price, 9);

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: timestamp,
        paymentTokenAddress,
        price,
        priceUSD: 0,
        buyerAddress: buyer_address || "",
        sellerAddress: seller_address || "",
      };
    });
    */
  }
}
