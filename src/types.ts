export enum Blockchain {
  Any = "any",
  Ethereum = "ethereum",
}

export enum AdapterType {
  Moralis = "moralis",
}

export enum Marketplace {
  Opensea = "opensea",
}

export class LowVolumeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LowVolumeError";
  }
}
