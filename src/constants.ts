import { Blockchain, MoralisChain } from "./types";

export const ONE_HOUR = 1;

export const DEFAULT_TOKEN_ADDRESSES: any = {
  [Blockchain.Ethereum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Arbitrum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.ImmutableX]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Solana]: "11111111111111111111111111111111",
  [Blockchain.Binance]: "BSC0x0000000000000000000000000000000000000000",
  [Blockchain.Terra]: "Terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu",
};

export const MORALIS_CHAINS: Record<Blockchain, MoralisChain> = {
  [Blockchain.Any]: MoralisChain.None,
  [Blockchain.Solana]: MoralisChain.None,
  [Blockchain.ImmutableX]: MoralisChain.None,
  [Blockchain.Arbitrum]: MoralisChain.None,
  [Blockchain.Terra]: MoralisChain.None,
  [Blockchain.Ethereum]: MoralisChain.Ethereum,
  [Blockchain.Binance]: MoralisChain.Binance,
};

export const COINGECKO_IDS: any = {
  [Blockchain.Ethereum]: {
    geckoId: "ethereum",
    platform: "ethereum",
    symbol: "eth",
  },
  [Blockchain.Arbitrum]: {
    geckoId: "arbitrum-one",
    platform: "arbitrum-one",
    symbol: "eth",
  },
  [Blockchain.Solana]: {
    geckoId: "solana",
    platform: "solana",
    symbol: "sol",
  },
  [Blockchain.Binance]: {
    geckoId: "binancecoin",
    platform: "binance-smart-chain",
    symbol: "bnb",
  },
  [Blockchain.Terra]: {
    geckoId: "terra-luna",
    platform: "terra",
    symbol: "luna",
  },
};
