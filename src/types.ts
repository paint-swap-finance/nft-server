export enum Blockchain {
  Any = "any",
  Ethereum = "ethereum",
  Solana = "solana",
}

export enum AdapterType {
  Moralis = "moralis",
}

export enum Marketplace {
  Opensea = "opensea",
  MagicEden = "magic-eden",
}

export class LowVolumeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LowVolumeError";
  }
}

export interface CollectionData {
  address: string;
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

export interface StatisticData {
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

export interface CollectionAndStatisticData {
  metadata: CollectionData;
  statistics: StatisticData;
}

export interface SaleData {
  txnHash: string;
  timestamp: string;
  paymentToken: string;
  price: number;
  priceUSD: bigint;
  sellerAddress: string;
  buyerAddress: string;
  marketplace: Marketplace;
  collection: any; //TODO fix
}