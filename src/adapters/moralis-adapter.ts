import { ethers } from "ethers";
import { Collection } from "../models/collection";
import { DataAdapter } from ".";
import { MORALIS_APP_ID, MORALIS_SERVER_URL } from "../../env";
import { AdapterType, Blockchain } from "../types";
import { AdapterState } from "../models/adapter-state";
import { sleep } from "../utils";
const Moralis = require("moralis/node");

async function fetchCollectionAddresses() {
  let adapterState = await AdapterState.findByName(AdapterType.Moralis);
  if (!adapterState) {
    adapterState = AdapterState.create({ name: AdapterType.Moralis })
    adapterState.save()
  }

  let collections = {};
  const provider = new ethers.providers.StaticJsonRpcProvider(process.env.ETHEREUM_RPC);
  const startBlock = await provider.getBlockNumber();
  const endBlock = adapterState.lastSyncedBlockNumber; 

  console.log(`Retrieving NFT collections parsing txns between blocks ${startBlock} --> ${endBlock}`);
  for (let blockNumber = startBlock; blockNumber >= endBlock; blockNumber--) {
    try {
      const nftTransfers = await Moralis.Web3API.native.getNFTTransfersByBlock({ chain: 'eth', block_number_or_hash: blockNumber.toString() });
      collections = nftTransfers.result.map((nft: any) => ({
        address: nft.token_address,
        tokenId: nft.token_id
      }))
      .reduce((allCollections: any, nextCollection: any) => ({
        ...allCollections,
        [nextCollection.address]: Collection.create({
          address: nextCollection.address.toLowerCase(),
          defaultTokenId: nextCollection.tokenId.toLowerCase(),
          chain: Blockchain.Ethereum,
        }),
      }), collections);

      const entryCount = Object.keys(collections).length;
      if (entryCount > 100) {
        Collection.save(Object.values(collections));
        collections = {};
        console.log("Finished syncing collections from blockNumber", blockNumber);
      }
    } catch (e) {
      console.error("Error retrieving data from Moralis:", JSON.stringify(e.message))
    }
  }
  adapterState.lastSyncedBlockNumber = BigInt(startBlock);
  adapterState.save()
}

async function run(): Promise<void> {
  Moralis.initialize(MORALIS_APP_ID);
  Moralis.serverURL = MORALIS_SERVER_URL;

  while (true) {
    await fetchCollectionAddresses();
    await sleep(60*30);
  }
}

const MoralisAdapter: DataAdapter = { run };
export default MoralisAdapter;