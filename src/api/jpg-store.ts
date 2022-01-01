/* eslint-disable camelcase */

import axios from "axios";
import { roundUSD, convertByDecimals } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { Collection } from "../models/collection";

interface JpgStoreTransactionData {
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
}

export interface JpgStoreCollectionData {
  name: string; // slug
  policy_id: string;
  items: number;
  owners: number;
  floor_lovelace: string;
  volume_lovelace: string;
  display_name: string;
  description: string;
  twitter_link?: string;
  discord_link?: string;
  website_link?: string;
  telegram_link?: string;
  instagram_link?: string;
  medium_link?: string;
  last_updated: string;
  attributes_title?: string;
  royalty_address: string;
  royalty_percentage_thousands: number;
  hero_image_file_type: string;
  is_hidden: boolean;
  is_verified: boolean;
  created_at: string;
  hero_image?: string;
  is_scraped: boolean;
}

export class JpgStore {
  public static async getAllCollections(): Promise<JpgStoreCollectionData[]> {
    const url = `https://www.jpg.store/api/collection`;
    const response = await axios.post(url);
    let { collections, cursor } = response.data;
    let newCollections = collections;

    while (newCollections && newCollections.length >= 20) {
      newCollections = [];
      const response = await axios.post(url, {
        cursor,
      });
      const data = response.data;
      collections = [...collections, ...data.collections];
      cursor = data.cursor;
      newCollections = data.collections;
    }

    return collections;
  }

  /*
  public static async getCollection(
    collection: JpgStoreCollectionData,
    adaInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const {
      display_name: name,
      name: slug,
      policy_id: address,
      items,
      owners,
      floor_lovelace: floor_price,
      volume_lovelace: total_volume,
      description,
      twitter_link,
      discord_link: discord_url,
      website_link: website,
      telegram_link: telegram_url,
      medium_link,
    } = collection;

    const logo = `https://d3exlhvlmmfsby.cloudfront.net/photos/hero-image/${slug}.webp`;
    const floor = convertByDecimals(parseInt(floor_price), 6) || 0;
    const dailyVolume = 0; // TODO
    const totalVolume = convertByDecimals(parseInt(total_volume), 6) || 0;
    const marketCap = items * floor || 0;
    const twitter_username = twitter_link
      ? twitter_link.split("/").slice(-1)[0]
      : null;
    const medium_username = medium_link
      ? medium_link.split("/").slice(-1)[0]
      : null;

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
        medium_username,
        chains: [Blockchain.Cardano],
        marketplaces: [Marketplace.JpgStore],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD: roundUSD(dailyVolume * adaInUSD),
        owners,
        floor,
        floorUSD: roundUSD(floor * adaInUSD),
        totalVolume,
        totalVolumeUSD: roundUSD(totalVolume * adaInUSD),
        marketCap,
        marketCapUSD: roundUSD(marketCap * adaInUSD),
      },
    };
  }

  public static async getSales(
    collection: Collection,
    occurredAfter: number
  ): Promise<(SaleData | undefined)[]> {
    const url = `https://www.jpg.store/api/policy/ee6da4b71e0913cbebec02edc23653f9b970af69324fdddfed1285d9/sales/1`;
    const response = await axios.get(url);
    const results = response.data?.results;

    if (!results) {
      return [];
    }

    return response.data.results.map((sale: JpgStoreTransactionData) => {
      const createdAt = new Date(sale.createdAt).getTime();

      if (sale.txType !== "exchange") {
        return undefined;
      }
      if (createdAt < occurredAfter) {
        return undefined;
      }

      const paymentTokenAddress = DEFAULT_TOKEN_ADDRESSES[Blockchain.Solana];
      const { transaction_id: txnHash } = sale;
      const {
        total_amount: total_price,
        buyer_address,
        seller_address,
      } = sale.parsedTransaction;

      const price = convertByDecimals(total_price, 9);

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: createdAt.toString(),
        paymentTokenAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        buyerAddress: buyer_address || "",
        sellerAddress: seller_address || "",
        chain: Blockchain.Solana,
        marketplace: Marketplace.JpgStore,
      };
    });
  }
  */
}
