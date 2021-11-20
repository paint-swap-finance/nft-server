export interface NFTCollection {
  id: string;
  contract: string;
  item: string;
  name: string;
}

const nftCollections: NFTCollection[] = [
  {
    id: "crypto-punks",
    contract: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    item: "4402",
    name: "CryptoPunks",
  },
  {
    id: "bayc",
    contract: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    item: "5212",
    name: "BAYC",
  },
  {
    id: "loot",
    contract: "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7",
    item: "2771",
    name: "Loot",
  },
  {
    id: "mayc",
    contract: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
    item: "22182",
    name: "MAYC",
  },
  {
    id: "art-blocks-curated",
    contract: "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    item: "74000274",
    name: "Art Blocks Curated",
  },
  {
    id: "meebits",
    contract: "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7",
    item: "7708",
    name: "Meebits",
  },
  {
    id: "cool-cats",
    contract: "0x1a92f7381b9f03921564a437210bb9396471050c",
    item: "5847",
    name: "Cool Cats",
  },
  {
    id: "0n1-force",
    contract: "0x3bf2922f4520a8ba0c2efc3d2a1539678dad5e9d",
    item: "3789",
    name: "0N1 Force",
  },
  {
    id: "pudgy-penguins",
    contract: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
    item: "7373",
    name: "Pudgy Penguins",
  },
  {
    id: "parallel-alpha",
    contract: "0x76be3b62873462d2142405439777e971754e8e77",
    item: "10089",
    name: "Parallel Alpha",
  },
  {
    id: "cryp-toadz",
    contract: "0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6",
    item: "1683",
    name: "CrypToadz",
  },
  {
    id: "creature-world-nft",
    contract: "0xc92ceddfb8dd984a89fb494c376f9a48b999aafc",
    item: "4952",
    name: "Creature World NFT",
  },
  {
    id: "sup-ducks",
    contract: "0x3fe1a4c1481c8351e91b64d5c398b159de07cbc5",
    item: "5536",
    name: "SupDucks",
  },
  {
    id: "sorare",
    contract: "0x629a673a8242c2ac4b7b8c5d8735fbeac21a6205",
    item: "93413048755406577872706166263267868455781906435673030502405621390756186649773",
    name: "Sorare",
  },
];

export default nftCollections;
