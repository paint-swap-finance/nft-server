import { Collection } from "./models/collection";

export enum Blockchain {
  Any = "any",
  Ethereum = "ethereum",
  Solana = "solana",
  ImmutableX = "immutablex",
  Binance = "binance",
  Arbitrum = "arbitrum",
}

export const BlockchainReverseLookup = new Map<
  Blockchain,
  keyof typeof Blockchain
>(
  Object.entries(Blockchain).map(
    ([key, value]: [keyof typeof Blockchain, Blockchain]) => [value, key]
  )
);

export enum AdapterType {
  Moralis = "moralis",
}

export enum Marketplace {
  Opensea = "opensea",
  MagicEden = "magic-eden",
  ImmutableX = "immutablex",
  PancakeSwap = "pancakeswap",
  Treasure = "treasure",
}

export enum MoralisChain {
  Ethereum = "eth",
  Binance = "bsc",
  None = "",
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
  paymentTokenAddress: string;
  price: number;
  priceBase: number;
  priceUSD: bigint;
  sellerAddress: string;
  buyerAddress: string;
  marketplace: Marketplace;
  collection: Collection;
}
