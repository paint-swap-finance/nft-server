import { Blockchain, Marketplace, MoralisChain } from "./types";

export const ONE_HOUR = 1;

export const DEFAULT_TOKEN_ADDRESSES: Record<Blockchain, string> = {
  [Blockchain.Ethereum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Arbitrum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.ImmutableX]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Solana]: "11111111111111111111111111111111",
  [Blockchain.BSC]: "bsc:0x0000000000000000000000000000000000000000",
  [Blockchain.Terra]: "Terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu",
  [Blockchain.Cardano]: "addr11111111111111111111111111111111",
  [Blockchain.Avalanche]: "avax:0x0000000000000000000000000000000000000000",
  [Blockchain.Fantom]: "ftm:0x0000000000000000000000000000000000000000",
  [Blockchain.Harmony]: "one:0x0000000000000000000000000000000000000000",
};

export const MORALIS_CHAINS: Record<Blockchain, MoralisChain> = {
  [Blockchain.Solana]: MoralisChain.None,
  [Blockchain.ImmutableX]: MoralisChain.None,
  [Blockchain.Arbitrum]: MoralisChain.None,
  [Blockchain.Terra]: MoralisChain.None,
  [Blockchain.Cardano]: MoralisChain.None,
  [Blockchain.Fantom]: MoralisChain.None,
  [Blockchain.Harmony]: MoralisChain.None,
  [Blockchain.Avalanche]: MoralisChain.None,
  [Blockchain.Ethereum]: MoralisChain.Ethereum,
  [Blockchain.BSC]: MoralisChain.BSC,
};

export const MARKETPLACE_CHAINS: Record<Marketplace, Blockchain[]> = {
  [Marketplace.MagicEden]: [Blockchain.Solana],
  [Marketplace.ImmutableX]: [Blockchain.ImmutableX],
  [Marketplace.Treasure]: [Blockchain.Arbitrum],
  [Marketplace.RandomEarth]: [Blockchain.Terra],
  [Marketplace.JpgStore]: [Blockchain.Cardano],
  [Marketplace.PaintSwap]: [Blockchain.Fantom],
  [Marketplace.DefiKingdoms]: [Blockchain.Harmony],
  [Marketplace.NFTrade]: [Blockchain.Avalanche],
  [Marketplace.Opensea]: [Blockchain.Ethereum],
  [Marketplace.PancakeSwap]: [Blockchain.BSC],
  [Marketplace.NFTKEY]: [
    Blockchain.Fantom,
    Blockchain.BSC,
    Blockchain.Harmony,
    Blockchain.Avalanche,
    Blockchain.Ethereum,
  ],
};

export const CHAIN_MARKETPLACES: Record<Blockchain, Marketplace[]> = {
  [Blockchain.Solana]: [Marketplace.MagicEden],
  [Blockchain.ImmutableX]: [Marketplace.ImmutableX],
  [Blockchain.Arbitrum]: [Marketplace.Treasure],
  [Blockchain.Terra]: [Marketplace.RandomEarth],
  [Blockchain.Cardano]: [Marketplace.JpgStore],
  [Blockchain.Fantom]: [Marketplace.PaintSwap, Marketplace.NFTKEY],
  [Blockchain.Harmony]: [Marketplace.DefiKingdoms, Marketplace.NFTKEY],
  [Blockchain.Avalanche]: [Marketplace.NFTrade, Marketplace.NFTKEY],
  [Blockchain.Ethereum]: [Marketplace.Opensea, Marketplace.NFTKEY],
  [Blockchain.BSC]: [Marketplace.PancakeSwap, Marketplace.NFTKEY],
};

export const COINGECKO_IDS: Record<Blockchain, any> = {
  [Blockchain.Ethereum]: {
    geckoId: "ethereum",
    llamaId: "ethereum",
    platform: "ethereum",
    symbol: "eth",
  },
  [Blockchain.ImmutableX]: {
    geckoId: "ethereum",
    llamaId: "",
    platform: "ethereum",
    symbol: "eth",
  },
  [Blockchain.Arbitrum]: {
    geckoId: "ethereum",
    llamaId: "",
    platform: "arbitrum-one",
    symbol: "eth",
  },
  [Blockchain.Solana]: {
    geckoId: "solana",
    llamaId: "",
    platform: "solana",
    symbol: "sol",
  },
  [Blockchain.BSC]: {
    geckoId: "binancecoin",
    llamaId: "",
    platform: "binance-smart-chain",
    symbol: "bnb",
  },
  [Blockchain.Terra]: {
    geckoId: "terra-luna",
    llamaId: "",
    platform: "terra",
    symbol: "luna",
  },
  [Blockchain.Cardano]: {
    geckoId: "cardano",
    llamaId: "",
    platform: "cardano",
    symbol: "ada",
  },
  [Blockchain.Avalanche]: {
    geckoId: "avalanche-2",
    llamaId: "avax",
    platform: "avalanche",
    symbol: "avax",
  },
  [Blockchain.Fantom]: {
    geckoId: "fantom",
    llamaId: "fantom",
    platform: "fantom",
    symbol: "ftm",
  },
  [Blockchain.Harmony]: {
    geckoId: "harmony",
    llamaId: "harmony",
    platform: "harmony-shard-0",
    symbol: "one",
  },
};
