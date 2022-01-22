import axios from "axios";
import { HistoricalStatistics } from "../models";

import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { convertByDecimals, roundUSD } from "../utils";

export interface DefiKingdomsCollectionData {
  floorPrice: string;
  totalListings: string;
  totalVolume: string;
}

export interface DefiKingdomsTransactionBuyerSeller {
  id: string;
}

export interface DefiKingdomsTransactionData {
  blockTimestamp: string;
  buyer: DefiKingdomsTransactionBuyerSeller;
  seller: DefiKingdomsTransactionBuyerSeller;
  pricePerItem: string;
  quantity: string;
  transactionLink: string;
}

export class DefiKingdoms {
  public static async getCollection(
    collection: any,
    jewelInUsd: number,
    jewelInOne: number
  ): Promise<CollectionAndStatisticData> {
    const address = collection.address.toLowerCase();
    const { name, slug } = collection;

    const { totalVolume, totalVolumeUSD } =
      await HistoricalStatistics.getCollectionTotalVolume({
        slug,
        marketplace: Marketplace.DefiKingdoms,
      });

    const { dailyVolume, dailyVolumeUSD } =
      await HistoricalStatistics.getCollectionDailyVolume({
        slug,
        marketplace: Marketplace.DefiKingdoms,
      });

    const response = await axios.post(
      "https://us-central1-defi-kingdoms-api.cloudfunctions.net/query_heroes",
      {
        limit: 1,
        offset: 0,
        order: {
          orderBy: "saleprice",
          orderDir: "asc",
        },
        params: [
          {
            field: "saleprice",
            operator: ">=",
            value: "1000000000000000000",
          },
        ],
      }
    );

    const floorHero = (response.data &&
      response.data.length &&
      response.data[0]) || {
      saleprice: 0,
    };
    const { saleprice: floorRaw } = floorHero;
    const floor = convertByDecimals(parseInt(floorRaw), 18);

    return {
      metadata: {
        address,
        name,
        slug,
        symbol: null,
        description: null,
        logo: null,
        website: null,
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: null,
        chains: [Blockchain.Harmony],
        marketplaces: [Marketplace.DefiKingdoms],
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD,
        owners: 0,
        floor: floor * jewelInOne,
        floorUSD: roundUSD(floor * jewelInUsd),
        totalVolume,
        totalVolumeUSD,
        marketCap: 0,
        marketCapUSD: 0,
      },
    };
  }

  public static async getSales(
    address: string,
    occurredFrom: number
  ): Promise<(SaleData | undefined)[]> {
    return;
  }
}
