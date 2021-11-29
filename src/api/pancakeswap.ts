import axios from "axios";
import util from "util";
import { request, gql } from "graphql-request";
import { CollectionAndStatisticData } from "../types";

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
    collection: PancakeSwapCollectionData
  ): Promise<CollectionAndStatisticData> {
    const collectionQuery = gql`
      query getCollectionData($collectionAddress: String!) {
        collection(id: $collectionAddress) {
          id,
          name,
          symbol,
          active,
          totalTrades,
          totalVolumeBNB,
          numberTokensListed,
          creatorAddress,
          tradingFee,
          creatorFee,
          whitelistChecker
        }
      }
    `;
    const data = await request(PANCAKESWAP_ENDPOINT, collectionQuery, {
      collectionAddress: collection.address,
    });
    console.log(data);
    return;
  }
}
