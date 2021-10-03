import * as AWS from 'aws-sdk'
import axios from 'axios'

import collections, { NFTCollection } from './collections'
import { sleep } from './utils'

AWS.config.region = "eu-central-1"
const TableName = "prod-table";
const ddb =  new AWS.DynamoDB.DocumentClient();

enum Blockchain {
  Ethereum = 'ethereum' 
}

interface NFTData {
  dailyVolume: number,
  dailyVolumeUsd: number,
  owners: number,
  floor: number,
  floorUsd: number,
  totalVolume: number,
  totalVolumeUsd: number,
  marketCap: number,
  marketCapUsd: number,
  chain: Blockchain
}

function timestamp(): number {
  return Math.round(Date.now()/1000)
}

function roundUsd(num: number): number {
  return Math.round(num)
}

export async function getEthPrice(): Promise<number> {
  const coingeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/ethereum'

  const response = await axios.get(coingeckoEndpoint)
  const { usd } = response.data.market_data.current_price
  return usd
}

export async function getNFTData(collection: NFTCollection, ethInUsd: number): Promise<NFTData> {
  const url = `https://api.opensea.io/api/v1/asset/${collection.contract}/${collection.item}/`
  const data = await axios.get(url)
  const { one_day_volume, num_owners, floor_price, total_volume, market_cap } = data.data.collection.stats
  return {
    dailyVolume: one_day_volume,
    dailyVolumeUsd: roundUsd(one_day_volume * ethInUsd),
    owners: num_owners,
    floor: floor_price,
    floorUsd: roundUsd(floor_price * ethInUsd),
    totalVolume: total_volume,
    totalVolumeUsd: roundUsd(total_volume * ethInUsd),
    marketCap: market_cap,
    marketCapUsd: roundUsd(market_cap * ethInUsd),
    chain: Blockchain.Ethereum,
  }
}

async function storeData(id: string, nftData: NFTData) {
  await ddb.put({
    TableName,
    'Item': {
      PK: `nfts#${id}`,
      SK: timestamp(),
      ...nftData,
    },
  }).promise();
}

export async function getNFTDataAndStore(): Promise<void> {
  while (true) {
    for (const collection of collections) {
      const ethInUsd = await getEthPrice()
      const nftData = await getNFTData(collection, ethInUsd)
      await storeData(collection.id, nftData)
      await sleep(30)
    }
    await sleep(30*60)
  }
}