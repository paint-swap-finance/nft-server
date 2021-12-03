import { Blockchain, MoralisChain } from "./types";

export const ONE_HOUR = 1;

export const DEFAULT_TOKEN_ADDRESSES: any = {
  [Blockchain.Ethereum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Arbitrum]: "0x0000000000000000000000000000000000000000",
  [Blockchain.ImmutableX]: "0x0000000000000000000000000000000000000000",
  [Blockchain.Solana]: "11111111111111111111111111111111",
  [Blockchain.Binance]: "BSC0x0000000000000000000000000000000000000000",
};

export const MORALIS_CHAINS: Record<Blockchain, MoralisChain> = {
  [Blockchain.Any]: MoralisChain.None,
  [Blockchain.Solana]: MoralisChain.None,
  [Blockchain.ImmutableX]: MoralisChain.None,
  [Blockchain.Arbitrum]: MoralisChain.None,
  [Blockchain.Ethereum]: MoralisChain.Ethereum,
  [Blockchain.Binance]: MoralisChain.Binance,
};

export const COINGECKO_IDS: any = {
  [Blockchain.Ethereum]: {
    geckoId: "ethereum",
    symbol: "eth",
  },
  [Blockchain.Arbitrum]: {
    geckoId: "arbitrum-one",
    symbol: "eth",
  },
  [Blockchain.Solana]: {
    geckoId: "solana",
    symbol: "sol",
  },
  [Blockchain.Binance]: {
    geckoId: "binancecoin",
    symbol: "bnb",
  },
};
