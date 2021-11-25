/* eslint-disable camelcase */
import axios from "axios";
import { roundUSD } from "../utils";
import { SOLANA_DEFAULT_TOKEN_ADDRESS } from "../constants";
import { CollectionAndStatisticData, SaleData } from "../types";
import { Collection } from "../models/collection";

const MAGIC_EDEN_MULTIPLIER = 1_000_000_000;

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

    return {
      metadata: {
        name,
        slug,
        description,
        logo,
        symbol: null,
        website: null,
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: null,
      },
      statistics: {
        dailyVolume: one_day_volume / MAGIC_EDEN_MULTIPLIER,
        dailyVolumeUSD: BigInt(
          roundUSD((one_day_volume / MAGIC_EDEN_MULTIPLIER) * solInUSD)
        ),
        owners: 0, // TODO add owners, data is not available from Magic Eden
        floor: floor_price / MAGIC_EDEN_MULTIPLIER || 0,
        floorUSD: roundUSD((floor_price / MAGIC_EDEN_MULTIPLIER) * solInUSD),
        totalVolume: total_volume / MAGIC_EDEN_MULTIPLIER,
        totalVolumeUSD: BigInt(
          roundUSD((total_volume / MAGIC_EDEN_MULTIPLIER) * solInUSD)
        ),
        marketCap: market_cap / MAGIC_EDEN_MULTIPLIER,
        marketCapUSD: BigInt(
          roundUSD((market_cap / MAGIC_EDEN_MULTIPLIER) * solInUSD)
        ),
      },
    };
  }

  public static async getSales(
    collection: Collection,
    occurredAfter: number,
    solInUSD: number
  ): Promise<(SaleData | undefined)[]> {
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

      const paymentTokenAddress = SOLANA_DEFAULT_TOKEN_ADDRESS;
      const { transaction_id: txnHash, createdAt: timestamp } = sale;
      const {
        total_amount: total_price,
        buyer_address,
        seller_address,
      } = sale.parsedTransaction;

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: timestamp,
        paymentTokenAddress,
        price: total_price / MAGIC_EDEN_MULTIPLIER,
        priceUSD: BigInt(
          roundUSD((total_price / MAGIC_EDEN_MULTIPLIER) * solInUSD)
        ),
        buyerAddress: buyer_address || "",
        sellerAddress: seller_address || "",
      };
    });
  }
}
