import web3 from "web3";
import { DataAdapter } from ".";
import { Contract, AdapterState } from "../models";
import { Blockchain } from "../types";
import { handleError } from "../utils";
import { MORALIS_CHAINS } from "../constants";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Moralis = require("moralis/node");

const ETHEREUM_RPC = process.env.ETHEREUM_RPC;
const MORALIS_APP_ID = process.env.MORALIS_APP_ID;
const MORALIS_SERVER_URL = process.env.MORALIS_SERVER_URL;

async function fetchCollectionAddresses(chain: Blockchain, rpc: string) {
  let adapterState = await AdapterState.getMoralisAdapterState(chain);

  if (!adapterState) {
    adapterState = await AdapterState.createMoralisAdapterState(chain);
  }

  let collections = {};
  const provider = new web3(rpc);
  const startBlock = await provider.eth.getBlockNumber();
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
            [nextCollection.address]: {
              address: nextCollection.address.toLowerCase(),
              defaultTokenId: nextCollection.tokenId.toLowerCase(),
              chain,
            },
          }),
          collections
        );

      const entryCount = Object.keys(collections).length;
      if (entryCount >= 100) {
        await Contract.insert(Object.values(collections));
        collections = {};
        console.log(
          `Finished syncing ${chain} collections from blockNumber ${blockNumber}`
        );
      }
    } catch (e) {
      await handleError(e, "moralis-adapter:fetchCollectionAddresses");
    }
  }
  await AdapterState.updateMoralisLastSyncedBlockNumber(chain, startBlock);
}

async function run(): Promise<void> {
  try {
    Moralis.initialize(MORALIS_APP_ID);
    Moralis.serverURL = MORALIS_SERVER_URL;
    await Promise.all([
      fetchCollectionAddresses(Blockchain.Ethereum, ETHEREUM_RPC),
    ]);
  } catch (e) {
    await handleError(e, "moralis-adapter");
  }
}

const MoralisAdapter: DataAdapter = { run };
export default MoralisAdapter;
