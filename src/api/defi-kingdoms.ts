import { request, gql } from "graphql-request";
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

const TREASURE_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/wyze/treasure-marketplace";

const collectionQuery = gql`
  query getCollectionStats($id: ID!) {
    collection(id: $id) {
      floorPrice
      totalListings
      totalVolume
    }
  }
`;

const salesQuery = gql`
  query getActivity($id: ID!, $orderBy: Listing_orderBy!) {
    collection(id: $id) {
      listings(
        where: { status: Sold }
        orderBy: $orderBy
        orderDirection: desc
      ) {
        ...ListingFields
      }
    }
  }
  fragment ListingFields on Listing {
    blockTimestamp
    buyer {
      id
    }
    pricePerItem
    quantity
    seller: user {
      id
    }
    transactionLink
  }
`;

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

    // const floor = convertByDecimals(parseInt(floorPrice), 18);
    // const marketCap = floor * parseInt(totalListings);

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
        floor: 0, // floor * jewelInOne,
        floorUSD: 0, //roundUSD(floor * jewelInUsd),
        totalVolume,
        totalVolumeUSD,
        marketCap: 0, //marketCap * jewelInOne,
        marketCapUSD: 0, //roundUSD(marketCap * jewelInUsd),
      },
    };
  }

  public static async getSales(
    address: string,
    occurredFrom: number
  ): Promise<(SaleData | undefined)[]> {
    const { collection } = await request(TREASURE_ENDPOINT, salesQuery, {
      id: address,
      orderBy: "blockTimestamp",
    });

    const { listings: transactions } = collection;

    return transactions.map((sale: any) => {
      if (sale.blockTimestamp * 1000 <= occurredFrom) {
        return undefined;
      }

      const {
        transactionLink,
        pricePerItem,
        quantity,
        blockTimestamp: createdAt,
        buyer,
        seller,
      } = sale;
      const { id: buyerAddress } = buyer;
      const { id: sellerAddress } = seller;
      const paymentTokenAddress = "0x539bde0d7dbd336b79148aa742883198bbf60342";
      const splitLink = transactionLink ? transactionLink.split("/") : [];
      const txnHash = splitLink.length ? splitLink[splitLink.length - 1] : "";
      const price = convertByDecimals(
        parseInt(pricePerItem) * parseInt(quantity),
        18
      );

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: createdAt * 1000,
        paymentTokenAddress,
        price,
        priceBase: 0,
        priceUSD: 0,
        buyerAddress,
        sellerAddress,
        chain: Blockchain.Arbitrum,
        marketplace: Marketplace.DefiKingdoms,
      };
    });
  }
}
