/* eslint-disable camelcase */
import axios from "axios";
import { roundUSD } from "../utils";
import { LowVolumeError } from "../types";

const TEN_SOL = 10;
const MAGIC_EDEN_MULTIPLIER = 1000000000;

export class MagicEden {

  public static async getAllCollections(): Promise<any> { // TODO add type
    const url = `https://api-mainnet.magiceden.io/all_collections`;
    const response = await axios.get(url);
    const { collections } = response.data;

    return collections
  }

  public static async getCollection(
    collection: any, // TODO add type
    solInUSD: number
  ): Promise<any> { // TODO add type
    const url = `https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/${collection.slug}`;
    const response = await axios.get(url);

    const { 
      floorPrice: floor_price,
      volume24hr: one_day_volume,
      volumeAll: total_volume,
      listedTotalValue: market_cap,
    } = response.data?.results;

    const {
        name,
        image: logo,
        description,
        symbol: slug,
    } = collection;

    if (total_volume / MAGIC_EDEN_MULTIPLIER < TEN_SOL) {
      throw new LowVolumeError(
        `Collection ${name} has volume ${total_volume / MAGIC_EDEN_MULTIPLIER} < ${TEN_SOL}`
      );
    }

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
        dailyVolumeUSD: BigInt(roundUSD(one_day_volume / MAGIC_EDEN_MULTIPLIER * solInUSD)),
        owners: 0, // TODO add owners
        floor: floor_price / MAGIC_EDEN_MULTIPLIER || 0,
        floorUSD: roundUSD(floor_price / MAGIC_EDEN_MULTIPLIER * solInUSD),
        totalVolume: total_volume / MAGIC_EDEN_MULTIPLIER,
        totalVolumeUSD: BigInt(roundUSD(total_volume / MAGIC_EDEN_MULTIPLIER * solInUSD)),
        marketCap: market_cap / MAGIC_EDEN_MULTIPLIER,
        marketCapUSD: BigInt(roundUSD(market_cap / MAGIC_EDEN_MULTIPLIER * solInUSD)),
      },
    };
  }
}
