import { Blockchain, MoralisChain } from "./types";

export const ETHEREUM_DEFAULT_TOKEN_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export const SOLANA_DEFAULT_TOKEN_ADDRESS = "11111111111111111111111111111111";

export const BINANCE_DEFAULT_TOKEN_ADDRESS =
  "BSC0x0000000000000000000000000000000000000000";

export const ONE_HOUR = 1;

export const MORALIS_CHAINS: Record<Blockchain, MoralisChain> = {
  [Blockchain.Any]: MoralisChain.None,
  [Blockchain.Solana]: MoralisChain.None,
  [Blockchain.ImmutableX]: MoralisChain.None,
  [Blockchain.Arbitrum]: MoralisChain.None,
  [Blockchain.Ethereum]: MoralisChain.Ethereum,
  [Blockchain.Binance]: MoralisChain.Binance,
};
