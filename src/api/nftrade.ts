/* eslint-disable camelcase */

import axios from "axios";
import { roundUSD, convertByDecimals, getSlug } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";
import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { HistoricalStatistics, Collection } from "../models";

interface NFTradeTransactionData {
  id: number;
  tx_hash: string;
  policy_id: string;
  asset: string;
  datum_hash: string;
  action: string;
  price_lovelace: string;
  signer_address: string;
  script_address: string;
  created_at: string;
  seller_address: string;
  royalty_address: string;
  royalty_percentage_thousands: number;
  deleted_at?: string;
  asset_display_name: string;
  is_confirmed: boolean;
  asset_image: string;
  listing_id?: number;
  bundle_count?: number;
  asset_image_file_type: string;
}

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

  /*
  public static async getSales(
    collection: Collection,
    occurredAfter: number
  ): Promise<(SaleData | undefined)[]> {
    const url = `https://www.jpg.store/api/policy/${collection.address}/sales/total`;
    const response = await axios.get(url);
    const {
      _count: { policy_id },
    } = response.data;
    const pages = Math.ceil(policy_id / 100);
    let sales = [] as NFTradeTransactionData[];

    for (let page = pages - 1; page >= 0; page--) {
      if (page >= 0) {
        const url = `https://www.jpg.store/api/policy/${collection.address}/sales/${page}`;
        const response = await axios.get(url);
        const results = response.data;

        if (!results) {
          continue;
        }

        const oldestResult = results.slice(-1)[0];
        const oldestTimestamp = new Date(oldestResult?.created_at).getTime();

        if (oldestTimestamp < occurredAfter) {
          break;
        }

        sales = [...sales, ...results];
      }
    }

    return sales.map((sale: NFTradeTransactionData) => {
      const createdAt = new Date(sale?.created_at).getTime();

      if (sale.action !== "buy") {
        return undefined;
      }
      if (createdAt <= occurredAfter) {
        return undefined;
      }

      const paymentTokenAddress = DEFAULT_TOKEN_ADDRESSES[Blockchain.Cardano];
      const {
        tx_hash: txnHash,
        price_lovelace,
        signer_address: buyer_address,
        seller_address,
      } = sale;
      const price = convertByDecimals(parseInt(price_lovelace), 6);

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: createdAt.toString(),
        paymentTokenAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        buyerAddress: buyer_address || "",
        sellerAddress: seller_address || "",
        chain: Blockchain.Cardano,
        marketplace: Marketplace.NFTrade,
      };
    });
  }
  */
}
