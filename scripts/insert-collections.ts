import { createConnection } from "typeorm";
import { Sale } from "../src/models/sale";
import { Collection } from "../src/models/collection";
import { Statistic } from "../src/models/statistic";
import { HistoricalStatistic } from "../src/models/historical-statistic";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../env";
import { Blockchain } from "../src/types";

const collections = [
  {
    address: "0x21e1969884d477afd2afd4ad668864a0eebd644c",
    slug: "treasure-extra-life",
    chain: Blockchain.Arbitrum,
    name: "Extra Life",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0x21e1969884D477afD2Afd4Ad668864a0EebD644c",
  },
  {
    address: "0xf0a35ba261ece4fc12870e5b7b9e7790202ef9b5",
    slug: "treasure-keys",
    chain: Blockchain.Arbitrum,
    name: "Keys",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0xf0a35bA261ECE4FC12870e5B7b9E7790202EF9B5",
  },
  {
    address: "0x658365026d06f00965b5bb570727100e821e6508",
    slug: "treasure-legions",
    chain: Blockchain.Arbitrum,
    name: "Legions",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0x658365026D06F00965B5bb570727100E821e6508",
  },
  {
    address: "0xe83c0200e93cb1496054e387bddae590c07f0194",
    slug: "treasure-legions-genesis",
    chain: Blockchain.Arbitrum,
    name: "Legions Genesis",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0xE83c0200E93Cb1496054e387BDdaE590C07f0194",
  },
  {
    address: "0xd666d1cc3102cd03e07794a61e5f4333b4239f53",
    slug: "smol-brains-land",
    chain: Blockchain.Arbitrum,
    name: "Smol Brains Land",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://www.smolverse.lol/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fsmol-brain-monkey.b82c9b83.png&w=64&q=75",
    website:
      "https://marketplace.treasure.lol/collection/0xd666d1CC3102cd03e07794A61E5F4333B4239F53",
  },
  {
    address: "0x6325439389e0797ab35752b4f43a14c004f22a9c",
    slug: "smol-brains",
    chain: Blockchain.Arbitrum,
    name: "Smol Brains",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://www.smolverse.lol/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fsmol-brain-monkey.b82c9b83.png&w=64&q=75",
    website:
      "https://marketplace.treasure.lol/collection/0x6325439389E0797Ab35752B4F43a14C004f22A9c",
  },
  {
    address: "0xebba467ecb6b21239178033189ceae27ca12eadf",
    slug: "treasures",
    chain: Blockchain.Arbitrum,
    name: "Treasures",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0xEBba467eCB6b21239178033189CeAE27CA12EaDf",
  },
  {
    address: "0x3956c81a51feaed98d7a678d53f44b9166c8ed66",
    slug: "treasure-seed-of-life",
    chain: Blockchain.Arbitrum,
    name: "Seed of Life",
    symbol: "",
    description: "",
    defaultTokenId: "",
    logo: "https://lh3.googleusercontent.com/HVeYD0FDUiSpJgEoGwCH8u---YXV1n51jRq8j4UHQ87rFfJsXPSavipmwwwYnKBKzepV5b_Y8hiqiIglitv6TplaWajFIDSgiJaZiQk=s130",
    website:
      "https://marketplace.treasure.lol/collection/0x3956C81A51FeAed98d7A678d53F44b9166c8ed66",
  },
];

const main = () => {
  createConnection({
    type: "postgres",
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    entities: [Sale, Collection, Statistic, HistoricalStatistic],
    synchronize: true,
    logging: false,
  })
    .then(async (connection) => {
      console.log("Manually inserting", collections.length, "collections");
      for (const collection of collections) {
        console.log("Inserting collection", collection.name);
        const storedCollection = await Collection.create({ ...collection });
        await storedCollection.save()
      }
    })
    .catch((e) => console.error("Error", e.message));
};

main()
