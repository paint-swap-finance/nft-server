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

export interface MagicEdenCollectionData {
  symbol: string;
  candyMachineIds: string[];
  name: string;
  image: string;
  description: string;
  createdAt: string;
  enabledAttributesFilters: boolean;
  isDraft: boolean;
}

export class MagicEden {
  public static async getAllCollections(): Promise<MagicEdenCollectionData[]> {
    const url = `https://api-mainnet.magiceden.io/all_collections`;
    const response = await axios.get(url);
    const { collections } = response.data;

    return collections;
  }

  public static async getCollection(
    collection: MagicEdenCollectionData,
    solInUSD: number
  ): Promise<CollectionAndStatisticData> {
    const url = `https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/${collection.symbol}`;
    const response = await axios.get(url);

    const {
      floorPrice: floor_price,
      volume24hr: one_day_volume,
      volumeAll: total_volume,
      listedTotalValue: market_cap,
    } = response.data?.results;

    const { name, image: logo, description, symbol: slug } = collection;

    const address =
      collection.candyMachineIds?.length && collection.candyMachineIds[0]; //TODO Fix
    const floor = convertByDecimals(floor_price, 9) || 0;
    const dailyVolume = convertByDecimals(one_day_volume, 9) || 0;
    const totalVolume = convertByDecimals(total_volume, 9) || 0;
    const marketCap = convertByDecimals(market_cap, 9) || 0;

    return {
      metadata: {
        address,
        name,
        slug,
        description,
        logo,
        symbol: null,
        website: null,
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: "",
        chains: [Blockchain.Solana],
        marketplaces: [Marketplace.MagicEden],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD: roundUSD(dailyVolume * solInUSD),
        owners: 0, // TODO add owners, data is not available from Magic Eden
        floor,
        floorUSD: roundUSD(floor * solInUSD),
        totalVolume,
        totalVolumeUSD: roundUSD(totalVolume * solInUSD),
        marketCap,
        marketCapUSD: roundUSD(marketCap * solInUSD),
      },
    };
  }

  public static async getSales(
    collection: Collection,
    occurredAfter: number
  ): Promise<(SaleData | undefined)[]> {
    const url = `https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"collection_symbol":"${collection.slug}"}}`;
    const response = await axios.get(url);
    const results = response.data?.results;

    if (!results) {
      return [];
    }

    return response.data.results.map((sale: MagicEdenTransactionData) => {
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
        marketplace: Marketplace.MagicEden,
      };
    });
  }
}
