import { request, gql } from "graphql-request";

import {
  Blockchain,
  CollectionAndStatisticData,
  Marketplace,
  SaleData,
} from "../types";
import { convertByDecimals, roundUSD } from "../utils";

export interface TreasureCollectionData {
  floorPrice: string;
  totalListings: string;
  totalVolume: string;
}

export interface TreasureTransactionBuyerSeller {
  id: string;
}

export interface TreasureTransactionData {
  blockTimestamp: string;
  buyer: TreasureTransactionBuyerSeller;
  seller: TreasureTransactionBuyerSeller;
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

export class Treasure {
  public static async getCollection(
    collection: any,
    magicInUsd: number,
    magicInEth: number
  ): Promise<CollectionAndStatisticData> {
    const address = collection.address.toLowerCase();

    const { collection: collectionData } = await request(
      TREASURE_ENDPOINT,
      collectionQuery,
      {
        id: address,
      }
    );

    /*
    const { dailyVolume: dailyVolumeRaw } = await Collection.getDailyVolume(
      address
    );
    const dailyVolume = dailyVolumeRaw || 0;
    */

    const { floorPrice, totalListings, totalVolume: volume } = collectionData;
    const floor = convertByDecimals(parseInt(floorPrice), 18);
    const totalVolume = convertByDecimals(parseInt(volume), 18);
    const marketCap = floor * parseInt(totalListings);

    return {
      metadata: {
        address,
        name: null,
        slug: null,
        symbol: null,
        description: null,
        logo: null,
        website: null,
        discord_url: null,
        telegram_url: null,
        twitter_username: null,
        medium_username: null,
        chains: [Blockchain.Arbitrum],
        marketplaces: [Marketplace.Treasure],
      },
      statistics: {
        //dailyVolume: dailyVolume * magicInEth,
        //dailyVolumeUSD: roundUSD(dailyVolume * magicInUsd),
        dailyVolume: 0,
        dailyVolumeUSD: 0,
        owners: 0,
        floor: floor * magicInEth,
        floorUSD: roundUSD(floor * magicInUsd),
        totalVolume: totalVolume * magicInEth,
        totalVolumeUSD: roundUSD(totalVolume * magicInUsd),
        marketCap: marketCap * magicInEth,
        marketCapUSD: roundUSD(marketCap * magicInUsd),
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
        marketplace: Marketplace.Treasure,
      };
    });
  }
}
