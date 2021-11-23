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
