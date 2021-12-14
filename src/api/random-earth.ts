
/* eslint-disable camelcase */
/*
import axios from "axios";
import { roundUSD, convertByDecimals, getSlug } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { Collection } from "../models/collection";

interface RandomEarthTransactionBuyerSeller {
  addr: string;
  created_at: string;
  slug: string;
  name?: string;
  num_followers?: number;
  description?: string;
  twitter_sn?: string;
  profile_src?: string;
  type: string;
}

interface RandomEarthTransactionData {
  type: string;
  created_at: string;
  updated_at: string;
  order_hash: string;
  item_collection_addr: string;
  item_token_id: number;
  user_from_addr: string;
  user_to_addr: string;
  price: number;
  currency: Object;
  txhash: string;
  data: unknown;
  user_from: RandomEarthTransactionBuyerSeller;
  user_to: RandomEarthTransactionBuyerSeller;
  item: Object;
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

    const { totalVolume: totalVolumeRaw } = await Collection.getTotalVolume(
      address
    );
    const totalVolume = totalVolumeRaw || 0;

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
        chains: [Blockchain.Terra],
        marketplaces: [Marketplace.RandomEarth],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD: roundUSD(dailyVolume * lunaInUSD),
        owners,
        floor,
        floorUSD: roundUSD(floor * lunaInUSD),
        totalVolume,
        totalVolumeUSD: roundUSD(totalVolume * lunaInUSD),
        marketCap,
        marketCapUSD: roundUSD(marketCap * lunaInUSD),
      },
    };
  }

  public static async getSales(
    collection: Collection,
    occurredAfter: number
  ): Promise<(SaleData | undefined)[]> {
    // TODO fetch with pagination
    const url = `https://randomearth.io/api/activities?collection_addr=${collection.address}&limit=10000&sort=created_at.desc`;
    const response = await axios.get(url);
    let { activities: transactions } = response.data;

    if (!transactions) {
      return [];
    }

    return transactions.map((sale: RandomEarthTransactionData) => {
      if (sale.type !== "Trade") {
        return undefined;
      }
      if (!sale.txhash) {
        return undefined;
      }
      if (new Date(sale.created_at).getTime() < occurredAfter) {
        return undefined;
      }

      const paymentTokenAddress = DEFAULT_TOKEN_ADDRESSES[Blockchain.Terra];
      const {
        txhash: txnHash,
        created_at: timestamp,
        price: total_price,
        user_from_addr: seller_address,
        user_to_addr: buyer_address,
      } = sale;

      const price = convertByDecimals(total_price, 6);

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp,
        paymentTokenAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        buyerAddress: buyer_address || "",
        sellerAddress: seller_address || "",
      };
    });
  }
}

*/