import { ethers } from "ethers";
import { Collection } from "../models/collection";
import { DataAdapter } from ".";
import {
  BINANCE_RPC,
  ETHEREUM_RPC,
} from "../../env";
import { AdapterType, Blockchain } from "../types";
import { AdapterState } from "../models/adapter-state";
import { sleep } from "../utils";
import { MORALIS_CHAINS } from "../constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Moralis = require("moralis/node");

async function fetchCollectionAddresses(chain: Blockchain, rpc: string) {
  let adapterState = await AdapterState.findByNameAndChain(
    AdapterType.Moralis,
    chain
  );

  if (!adapterState) {
    adapterState = AdapterState.create({ name: AdapterType.Moralis, chain });
    adapterState.save();
  }

  let collections = {};
  const provider = new ethers.providers.StaticJsonRpcProvider(rpc);
  const startBlock = await provider.getBlockNumber();
  const endBlock = adapterState.lastSyncedBlockNumber;

  console.log(
    `Retrieving ${chain} NFT collections parsing txns between blocks ${startBlock} --> ${endBlock}`
  );
  for (let blockNumber = startBlock; blockNumber >= endBlock; blockNumber--) {
    try {
      const nftTransfers = await Moralis.Web3API.native.getNFTTransfersByBlock({
        chain: MORALIS_CHAINS[chain],
        block_number_or_hash: blockNumber.toString(),
      });
      collections = nftTransfers.result
        .map((nft: any) => ({
          address: nft.token_address,
          tokenId: nft.token_id,
        }))
        .reduce(
          (allCollections: any, nextCollection: any) => ({
            ...allCollections,
            [nextCollection.address]: Collection.create({
              address: nextCollection.address.toLowerCase(),
              defaultTokenId: nextCollection.tokenId.toLowerCase(),
              chain,
            }),
          }),
          collections
        );

      const entryCount = Object.keys(collections).length;
      if (entryCount > 100) {
        Collection.save(Object.values(collections));
        collections = {};
        console.log(
          `Finished syncing ${chain} collections from blockNumber ${blockNumber}`,
        );
      }
    } catch (e) {
      console.error(
        "Error retrieving data from Moralis:",
        JSON.stringify(e.message)
      );
    }
  }
  adapterState.lastSyncedBlockNumber = BigInt(startBlock);
  adapterState.save();
}

async function run(): Promise<void> {
  try {
    while (true) {
      await Promise.all([
        fetchCollectionAddresses(Blockchain.Ethereum, ETHEREUM_RPC),
        fetchCollectionAddresses(Blockchain.Binance, BINANCE_RPC),
      ]);
      await sleep(60 * 30);
    }
  } catch (e) {
    console.error("Moralis adapter error:", e.message);
  }
}

const MoralisAdapter: DataAdapter = { run };
export default MoralisAdapter;
