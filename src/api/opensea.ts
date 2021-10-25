import { BigNumber } from "@ethersproject/bignumber";
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

interface OpenseaSaleData {
  txnHash: string,
  timestamp: string,
  paymentToken: string,
  amount: number,
  seller: string,
  buyer: string,
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
        dailyVolumeUSD: BigInt(roundUSD(one_day_volume * ethInUSD)),
        owners: num_owners,
        floor: floor_price,
        floorUSD: roundUSD(floor_price * ethInUSD),
        totalVolume: total_volume,
        totalVolumeUSD: BigInt(roundUSD(total_volume * ethInUSD)),
        marketCap: market_cap,
        marketCapUSD: BigInt(roundUSD(market_cap * ethInUSD)),
      }
    }
  }
  public static async getSales(address: string, offset: number, limit: number): Promise<(OpenseaSaleData|undefined)[]> {
    const url = `https://api.opensea.io/api/v1/events?asset_contract_address=${address}&event_type=successful&only_opensea=false&offset=${offset}&limit=${limit}`;
    console.log(url);
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': OPENSEA_API_KEY }
    });
    return response.data.asset_events.map((sale: any) => {
      if (!sale.transaction) {
        return undefined;
      }
      const { transaction_hash: txnHash, timestamp } = sale.transaction;
      const { address: paymentTokenAddress, decimals } = sale.payment_token;
      const { total_price, winner_account, seller, created_date } = sale;
      return {
        txnHash: txnHash.toLowerCase(),
        timestamp: timestamp || created_date,
        paymentTokenAddress,
        price: BigNumber.from(total_price).div(BigNumber.from(10).pow(decimals)).toNumber(),
        buyerAddress: winner_account?.address || '',
        sellerAddress: seller?.address || '',
      }
    })
  }
}