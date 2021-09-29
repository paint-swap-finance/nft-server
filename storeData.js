const AWS = require('aws-sdk');
const axios = require('axios')
const collections = require('./collections')

AWS.config.region = "eu-central-1"
const ddb =  new AWS.DynamoDB.DocumentClient();
const TableName = "prod-table";

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function timestamp() {
    return Math.round(Date.now()/1000)
}

function roundUsd(num) {
    return Math.round(num)
}

async function getEthPrice() {
    const coingeckoEndpoint = 'https://api.coingecko.com/api/v3/coins/ethereum'

    const response = await axios.get(coingeckoEndpoint)
    const { usd } = response.data.market_data.current_price
    return usd
}

async function getNFTData(collection, ethInUsd) {
    const url = `https://api.opensea.io/api/v1/asset/${collection.contract}/${collection.item}/`
    const data = await axios.get(url)
    const { one_day_volume, num_owners, floor_price, total_volume, total_supply } = data.data.collection.stats
    return {
        dailyVolume: one_day_volume,
        dailyVolumeUsd: roundUsd(one_day_volume * ethInUsd),
        owners: num_owners,
        floor: floor_price,
        floorUsd: roundUsd(floor_price * ethInUsd),
        totalVolume: total_volume,
        totalVolumeUsd: roundUsd(total_volume * ethInUsd),
        marketCap: roundUsd(floor_price * ethInUsd * total_supply),
    }
}

async function storeData(id, nftData) {
    await ddb.put({
        TableName,
        'Item': {
            PK: `nfts#${id}`,
            SK: timestamp(),
            ...nftData,
        },
    }).promise();
}

async function getNFTDataAndStore() {
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

module.exports = {
    getNFTDataAndStore,
    getEthPrice,
    getNFTData
}