import AWS from "aws-sdk";
import { MOCK_DYNAMODB_ENDPOINT } from "../../env";
import { Blockchain, Marketplace } from "../types";

const client = new AWS.DynamoDB.DocumentClient({
  ...(MOCK_DYNAMODB_ENDPOINT && {
    endpoint: MOCK_DYNAMODB_ENDPOINT,
    sslEnabled: false,
    region: "local",
  }),
});
export const TableName = "prod-nft-table";

const dynamodb = {
  get: (params: Omit<AWS.DynamoDB.DocumentClient.GetItemInput, "TableName">) =>
    client.get({ TableName, ...params }).promise(),
  put: (
    item: AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap,
    params?: Partial<AWS.DynamoDB.DocumentClient.PutItemInput>
  ) => client.put({ TableName, ...params, Item: item }).promise(),
  query: (params: Omit<AWS.DynamoDB.DocumentClient.QueryInput, "TableName">) =>
    client.query({ TableName, ...params }).promise(),
  update: (
    params: Omit<AWS.DynamoDB.DocumentClient.UpdateItemInput, "TableName">
  ) => client.update({ TableName, ...params }).promise(),
  delete: (
    params: Omit<AWS.DynamoDB.DocumentClient.DeleteItemInput, "TableName">
  ) => client.delete({ TableName, ...params }).promise(),
  batchWrite: (items: AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap[]) =>
    client
      .batchWrite({
        RequestItems: {
          [TableName]: items.map((item) => ({ PutRequest: { Item: item } })),
        },
      })
      .promise(),
  batchGet: (keys: AWS.DynamoDB.DocumentClient.KeyList) =>
    client
      .batchGet({
        RequestItems: {
          [TableName]: {
            Keys: keys,
          },
        },
      })
      .promise(),
  scan: () => client.scan({ TableName }).promise(),
};
export default dynamodb;

// TODO Check if already exists
export function upsertCollection({
  slug,
  metadata,
  statistics,
  chain,
  marketplace,
}: {
  slug: string;
  metadata: any;
  statistics: any;
  chain: Blockchain;
  marketplace: Marketplace;
}) {
  return dynamodb.batchWrite([
    {
      PK: `collection#${slug}`,
      SK: "overview",
      category: "collections",
      ...metadata,
      ...statistics,
    },
    {
      PK: `collection#${slug}`,
      SK: `chain#${chain}`,
      category: `collections#chain#${chain}`,
      ...metadata,
      ...statistics,
    },
    {
      PK: `collection#${slug}`,
      SK: `marketplace#${marketplace}`,
      category: `collections#marketplace#${marketplace}`,
      ...metadata,
      ...statistics,
    },
  ]);
}

export function getSortedCollections({
  chain,
  marketplace,
}: {
  chain?: any;
  marketplace?: any;
}) {
  let category = "collections";

  if (chain) {
    category = `collections#chain#${chain}`;
  }
  if (marketplace) {
    category = `collections#marketplace#${marketplace}`;
  }

  if (category) {
    return dynamodb.query({
      IndexName: "collectionsIndex",
      KeyConditionExpression: "category = :category",
      ExpressionAttributeValues: {
        ":category": category,
      },
      ScanIndexForward: false,
    });
  }
}

export function getHistoricalValues(pk: string) {
  return dynamodb
    .query({
      ExpressionAttributeValues: {
        ":pk": pk,
      },
      KeyConditionExpression: "PK = :pk",
    })
    .then((result) => result.Items);
}
