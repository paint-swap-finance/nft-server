import axios from "axios";
import { request, gql } from "graphql-request";

import { Blockchain, CollectionAndStatisticData, SaleData } from "../types";
import { formatUSD, getSlug, roundUSD } from "../utils";
import { DEFAULT_TOKEN_ADDRESSES } from "../constants";

export interface PancakeSwapCollectionBanner {
  large: string;
  small: string;
}

export interface PancakeSwapCollectionData {
  address: string;
  avatar: string;
  banner: PancakeSwapCollectionBanner;
  createdAt: string;
  description: string;
  name: string;
  owner: string;
  symbol: string;
  totalSupply: string;
  updatedAt: string;
  verified: boolean;
}

const PANCAKESWAP_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/pancakeswap/nft-market";

const collectionQuery = gql`
  query getCollectionData($collectionAddress: String!) {
    collection(id: $collectionAddress) {
      totalVolumeBNB
      numberTokensListed
      dayData(orderBy: date, orderDirection: desc, first: 1) {
        dailyVolumeBNB
      }
    }
  }
`;

const floorQuery = gql`
  query getFloorData(
    $first: Int
    $skip: Int!
    $where: NFT_filter
    $orderBy: NFT_orderBy
    $orderDirection: OrderDirection
  ) {
    nfts(
      where: $where
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      skip: $skip
    ) {
      currentAskPrice
    }
  }
`;

const salesQuery = gql`
  query getSalesData(
    $first: Int
    $skip: Int!
    $id: String
    $timestamp: String
  ) {
    transactions(
      first: $first
      skip: $skip
      where: { collection: $id, timestamp_gte: $timestamp }
      orderBy: timestamp
      orderDirection: asc
    ) {
      id
      timestamp
      askPrice
      buyer {
        id
      }
      seller {
        id
      }
    }
  }
`;

export class PancakeSwap {
  public static async getAllCollections(): Promise<
    PancakeSwapCollectionData[]
  > {
    const url = `https://nft.pancakeswap.com/api/v1/collections`;
    const response = await axios.get(url);
    const { data } = response.data;

    return data;
  }

  public static async getCollection(
    collection: PancakeSwapCollectionData,
    bnbInUsd: number
  ): Promise<CollectionAndStatisticData> {
    const address = collection.address.toLowerCase();

    const collectionData = await request(
      PANCAKESWAP_ENDPOINT,
      collectionQuery,
      {
        collectionAddress: address,
      }
    );

    const floorData = await request(PANCAKESWAP_ENDPOINT, floorQuery, {
      first: 1,
      orderBy: "currentAskPrice",
      orderDirection: "asc",
      skip: 0,
      where: {
        collection: address,
        isTradable: true,
      },
    });

    const { name, symbol, description, banner } = collection;
    const {
      collection: { totalVolumeBNB: totalVolume, dayData, numberTokensListed },
    } = collectionData;
    const { dailyVolumeBNB: dailyVolume } = dayData[0];

    const { nfts } = floorData;
    const { currentAskPrice } = nfts[0];
    const floor = parseFloat(currentAskPrice);
    const marketCap = floor * parseInt(numberTokensListed);
    const slug = getSlug(name);
    const logo = banner.small;

    return {
      metadata: {
        address,
        name,
        slug,
        symbol,
        description,
        logo,
        website: `https://pancakeswap.finance/nfts/collections/${address}`,
        discord_url: "",
        telegram_url: "",
        twitter_username: "",
        medium_username: "",
      },
      statistics: {
        dailyVolume,
        dailyVolumeUSD: formatUSD(dailyVolume * bnbInUsd),
        owners: 0,
        floor: floor,
        floorUSD: roundUSD(floor * bnbInUsd),
        totalVolume: parseFloat(totalVolume),
        totalVolumeUSD: formatUSD(totalVolume * bnbInUsd),
        marketCap,
        marketCapUSD: formatUSD(marketCap * bnbInUsd),
      },
    };
  }
}
/*
  public static async getSales(
    address: string,
    occurredFrom: number
  ): Promise<(SaleData | undefined)[]> {
    const first = 1000; // Maximum value accepted by subgraph
    let skip = 0;
    let timestamp =
      occurredFrom > 1000
        ? (occurredFrom / 1000).toString()
        : occurredFrom.toString();
    let allTransactions = [] as any;
    let transactionCount = 0;

    const { transactions } = await request(PANCAKESWAP_ENDPOINT, salesQuery, {
      first,
      skip,
      timestamp,
      id: address,
    });

    transactionCount = transactions.length ?? 0;
    allTransactions = transactions ?? [];

    while (transactionCount) {
      skip += 1000;
      // Maximum value accepted by subgraph
      if (skip <= 5000) {
        const { transactions } = await request(
          PANCAKESWAP_ENDPOINT,
          salesQuery,
          {
            first,
            skip,
            id: address,
            timestamp,
          }
        );
        const newTransactions = transactions ?? [];
        transactionCount = newTransactions.length;
        allTransactions = [...allTransactions, ...newTransactions];
      } else {
        // Reset skip value and retrieve more sales
        const transactionLength = allTransactions.length;
        if (transactionLength) {
          const lastTimestamp =
            allTransactions[transactionLength - 1].timestamp;
          timestamp = lastTimestamp;
          skip = 0;
        }
      }
    }

    return allTransactions.map((sale: any) => {
      const {
        id: txnHash,
        askPrice: price,
        timestamp: createdAt,
        buyer,
        seller,
      } = sale;
      const { id: buyerAddress } = buyer;
      const { id: sellerAddress } = seller;
      const paymentTokenAddress = DEFAULT_TOKEN_ADDRESSES[Blockchain.BSC];

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: new Date(createdAt * 1000),
        paymentTokenAddress,
        price: parseFloat(price),
        priceBase: 0,
        priceUSD: BigInt(0),
        buyerAddress,
        sellerAddress,
      };
    });
  }
}

*/
