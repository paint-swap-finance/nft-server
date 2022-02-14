require("dotenv").config();

module.exports = {
  ETHEREUM_RPC: process.env.ETHEREUM_RPC,
  AVALANCHE_RPC: process.env.AVALANCHE_RPC,
  BSC_RPC: process.env.BSC_RPC,
  FANTOM_RPC: process.env.FANTOM_RPC,
  HARMONY_RPC: process.env.HARMONY_RPC,
  OPENSEA_API_KEY: process.env.OPENSEA_API_KEY,
  SECONDARY_OPENSEA_API_KEY: process.env.SECONDARY_OPENSEA_API_KEY,
  MORALIS_APP_ID: process.env.MORALIS_APP_ID,
  MORALIS_SERVER_URL: process.env.MORALIS_SERVER_URL,
  MOCK_DYNAMODB_ENDPOINT: process.env.MOCK_DYNAMODB_ENDPOINT,
  OPENSEARCH_DOMAIN: process.env.OPENSEARCH_DOMAIN,
  OPENSEARCH_USERNAME: process.env.OPENSEARCH_USERNAME,
  OPENSEARCH_PASSWORD: process.env.OPENSEARCH_PASSWORD,
  TABLE_ARN: process.env.TABLE_ARN,
  TABLE_INDEX_ARN: process.env.TABLE_INDEX_ARN,
  STREAM_ARN: process.env.STREAM_ARN,
};
