/* eslint-disable camelcase */
import axios from "axios";
import { URLSearchParams } from "url";

import { ETHEREUM_DEFAULT_TOKEN_ADDRESS } from "../constants";
import { OPENSEA_API_KEY, SECONDARY_OPENSEA_API_KEY } from "../../env";
import { roundUSD } from "../utils";
import { LowVolumeError } from "../types";

const TEN_ETHER = 10;

interface OpenseaCollectionData {
  name: string;
  slug: string;
  symbol: string;
  description: string;
  logo: string;
  website: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  medium_username: string;
}

interface OpenseaStatisticData {
  dailyVolume: number;
  dailyVolumeUSD: bigint;
  owners: number;
  floor: number;
  floorUSD: number;
  totalVolume: number;
  totalVolumeUSD: bigint;
  marketCap: number;
  marketCapUSD: bigint;
}

interface OpenseaCollectionAndStatisticData {
  metadata: OpenseaCollectionData;
  statistics: OpenseaStatisticData;
}

interface OpenseaSaleData {
  txnHash: string;
  timestamp: string;
  paymentToken: string;
  amount: number;
  seller: string;
  buyer: string;
}

export class Opensea {
  public static async getCollection(
    slug: string,
    ethInUSD: number
  ): Promise<OpenseaCollectionAndStatisticData> {
    const url = `https://api.opensea.io/api/v1/collection/${slug}/`;
    console.log(url);
    const response = await axios.get(url, {
      headers: { "X-API-KEY": OPENSEA_API_KEY },
    });
    const { collection } = response.data;
    const {
      description,
      name,
      discord_url,
      external_url,
      image_url,
      medium_username,
      telegram_url,
      twitter_username,
    } = collection;
    const { symbol } = collection.primary_asset_contracts[0] || {};
    const {
      one_day_volume,
      num_owners,
      floor_price,
      total_volume,
      market_cap,
    } = collection.stats;

    if (total_volume < TEN_ETHER) {
      throw new LowVolumeError(
        `Collection ${name} has volume ${total_volume} < ${TEN_ETHER}`
      );
    }
    return {
      metadata: {
        name,
        slug,
        symbol,
        description,
        logo: image_url,
        website: external_url,
        discord_url,
        telegram_url,
        twitter_username,
        medium_username,
      },
      statistics: {
        dailyVolume: one_day_volume,
        dailyVolumeUSD: BigInt(roundUSD(one_day_volume * ethInUSD)),
        owners: num_owners,
        floor: floor_price || 0,
        floorUSD: roundUSD(floor_price * ethInUSD),
        totalVolume: total_volume,
        totalVolumeUSD: BigInt(roundUSD(total_volume * ethInUSD)),
        marketCap: market_cap,
        marketCapUSD: BigInt(roundUSD(market_cap * ethInUSD)),
      },
    };
  }

  public static async getContract(
    address: string,
    tokenId: string
  ): Promise<OpenseaCollectionData> {
    const url = `https://api.opensea.io/api/v1/asset/${address}/${tokenId}/`;
    console.log(url);
    const response = await axios.get(url, {
      headers: { "X-API-KEY": OPENSEA_API_KEY },
    });
    const { collection, name, symbol, description, external_link, image_url } =
      response.data;

    const {
      discord_url,
      slug,
      telegram_url,
      twitter_username,
      medium_username,
      image_url: tokenUrl,
    } = collection;

    return {
      name,
      slug,
      symbol,
      description,
      logo: image_url || tokenUrl,
      website: external_link,
      discord_url,
      telegram_url,
      twitter_username,
      medium_username,
    };
  }

  public static async getSales(
    address: string,
    occurredAfter: number,
    offset: number,
    limit: number
  ): Promise<(OpenseaSaleData | undefined)[]> {
    const params: Record<string, string> = {
      asset_contract_address: address,
      occurred_after: occurredAfter.toString(),
      offset: offset.toString(),
      limit: limit.toString(),
      event_type: "successful",
      only_opensea: "false",
    };
    const searchParams = new URLSearchParams(params);
    const url = `https://api.opensea.io/api/v1/events?${searchParams.toString()}`;
    console.log(url);
    const response = await axios.get(url, {
      headers: { "X-API-KEY": SECONDARY_OPENSEA_API_KEY },
    });
    return response.data.asset_events.map((sale: any) => {
      if (!sale.transaction) {
        return undefined;
      }
      const paymentToken = sale.payment_token || {
        address: ETHEREUM_DEFAULT_TOKEN_ADDRESS,
        decimals: 18,
      };

      const { transaction_hash: txnHash, timestamp } = sale.transaction;
      const { address: paymentTokenAddress, decimals } = paymentToken;
      const { total_price, winner_account, seller, created_date } = sale;

      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: timestamp || created_date,
        paymentTokenAddress,
        price: parseFloat(total_price) / 10 ** decimals,
        buyerAddress: winner_account?.address || "",
        sellerAddress: seller?.address || "",
      };
    });
  }
}
