import { getEthPrice, getNFTData } from '../src/storeData'
import collections from '../src/collections'
import { sleep } from '../src/utils'

async function main(): Promise<void> {
  for (const collection of collections) {
    const ethInUsd = await getEthPrice()
    const nftData = await getNFTData(collection, ethInUsd)
    console.log(nftData)
    await sleep(10)
  }
}

main()