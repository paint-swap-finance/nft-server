import axios from "axios";
import { request, gql } from "graphql-request";
import { CollectionAndStatisticData } from "../types";
import { formatUSD, getSlug, roundUSD } from "../utils";

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
      collection: { totalVolumeBNB: totalVolume },
    } = collectionData;
    const { nfts } = floorData;
    const { currentAskPrice: floor } = nfts[0];
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
        website: "",
        discord_url: "",
        telegram_url: "",
        twitter_username: "",
        medium_username: "",
      },
      statistics: {
        dailyVolume: 0,
        dailyVolumeUSD: BigInt(0),
        owners: 0,
        floor: parseFloat(floor),
        floorUSD: roundUSD(parseFloat(floor) * bnbInUsd),
        totalVolume: parseFloat(totalVolume),
        totalVolumeUSD: formatUSD(totalVolume * bnbInUsd),
        marketCap: 0,
        marketCapUSD: BigInt(0),
      },
    };
  }
}
