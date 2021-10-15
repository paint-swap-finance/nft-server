import axios from "axios";
import { OPENSEA_API_KEY } from "../../env";
import { roundUSD } from "../utils";

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
    dailyVolumeUSD: bigint,
    owners: number,
    floor: number,
    floorUSD: number,
    totalVolume: number,
    totalVolumeUSD: bigint,
    marketCap: number,
    marketCapUSD: bigint,
  }
}

export class Opensea {
  public static async getCollection(address: string, tokenId: string, ethInUSD: number): Promise<OpenseaCollectionData> {
    const url = `https://api.opensea.io/api/v1/asset/${address}/${tokenId}/`;
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': OPENSEA_API_KEY }
    });
    const { collection } = response.data;
    const contractMetadata = collection.primary_asset_contracts[0] || [];
    const { name, symbol, description, external_link, image_url } = contractMetadata;
    const { one_day_volume, num_owners, floor_price, total_volume, market_cap } = collection.stats;
    const { discord_url, slug, telegram_url, twitter_username, medium_username, image_url: tokenUrl } = collection;
    return {
      metadata: {
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
      },
      stats: {
        dailyVolume: one_day_volume,
        dailyVolumeUSD: BigInt(one_day_volume) * BigInt(ethInUSD),
        owners: num_owners,
        floor: floor_price,
        floorUSD: roundUSD(floor_price * ethInUSD),
        totalVolume: total_volume,
        totalVolumeUSD: BigInt(total_volume) * BigInt(ethInUSD),
        marketCap: market_cap,
        marketCapUSD: BigInt(market_cap) * BigInt(ethInUSD),
      }
    }
  }
}