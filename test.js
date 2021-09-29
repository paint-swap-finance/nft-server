const { getEthPrice, getNFTData } = require('./storeData')
const collections = require('./collections')

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function main() {
    for (const collection of collections) {
        const ethInUsd = await getEthPrice()
        const nftData = await getNFTData(collection, ethInUsd)
        console.log(nftData)
        await sleep(10)
    }
}

main()