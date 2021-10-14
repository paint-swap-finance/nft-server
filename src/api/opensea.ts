import axios from "axios";
import { roundUSD } from "../utils";
import { Coingecko } from "./coingecko";

interface OpenseaCollectionData {
  metadata: {
    name: string,
    slug: string,
    symbol: string,
    description: string,
    logo: string,
    website: string,
    discord_url: string,
    telegram_url: string,
    twitter_username: string,
    medium_username: string,
  },
  stats: {
    dailyVolume: number,
    dailyVolumeUSD: number,
    owners: number,
    floor: number,
    floorUSD: number,
    totalVolume: number,
    totalVolumeUSD: number,
    marketCap: number,
    marketCapUSD: number,
  }
}

export class Opensea {
  public static async getCollection(address: string, itemId: string): Promise<OpenseaCollectionData> {
    const url = `https://api.opensea.io/api/v1/asset/${address}/${itemId}/`;
    const ethInUSD = await Coingecko.getEthPrice();
    const response = await axios.get(url);
    const { one_day_volume, num_owners, floor_price, total_volume, market_cap } = response.data.collection.stats;
    const { discord_url, slug, telegram_url, twitter_username, medium_username } = response.data.collection;
    const { name, symbol, description, external_link, image_url } = response.data.collection.primary_asset_contracts[0];
    return {
      metadata: {
        name,
        slug,
        symbol,
        description,
        logo: image_url,
        website: external_link,
        discord_url,
        telegram_url,
        twitter_username,
        medium_username,
      },
      stats: {
        dailyVolume: one_day_volume,
        dailyVolumeUSD: roundUSD(one_day_volume * ethInUSD),
        owners: num_owners,
        floor: floor_price,
        floorUSD: roundUSD(floor_price * ethInUSD),
        totalVolume: total_volume,
        totalVolumeUSD: roundUSD(total_volume * ethInUSD),
        marketCap: market_cap,
        marketCapUSD: roundUSD(market_cap * ethInUSD),
      }
    }
  }
}