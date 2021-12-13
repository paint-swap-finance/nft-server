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

export async function upsertCollection({
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
  const collectionExists = await dynamodb
    .query({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `collection#${slug}`,
      },
    })
    .then((result) => result.Items);

  if (collectionExists.length) {
    const updateExpression = `
      SET owners = :owners,
          totalVolume = :totalVolume,
          totalVolumeUSD = :totalVolumeUSD,
          dailyVolume = :dailyVolume,
          dailyVolumeUSD = :dailyVolumeUSD,
          floor = :floor,
          floorUSD = :floorUSD,
          marketCap = :marketCap,
          marketCapUSD = :marketCapUSD`;

    const expressionAttributeValues = {
      ":owners": statistics.owners,
      ":totalVolume": statistics.totalVolume,
      ":totalVolumeUSD": statistics.totalVolumeUSD,
      ":dailyVolume": statistics.dailyVolume,
      ":dailyVolumeUSD": statistics.dailyVolumeUSD,
      ":floor": statistics.floor,
      ":floorUSD": statistics.floorUSD,
      ":marketCap": statistics.marketCap,
      ":marketCapUSD": statistics.marketCapUSD,
    };

    await dynamodb.update({
      Key: {
        PK: `collection#${slug}`,
        SK: "overview",
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    await dynamodb.update({
      Key: {
        PK: `collection#${slug}`,
        SK: `chain#${chain}`,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    await dynamodb.update({
      Key: {
        PK: `collection#${slug}`,
        SK: `marketplace#${marketplace}`,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    return;
  }

  await dynamodb.update({
    Key: {
      PK: `collectionCount`,
      SK: `chain#${chain}`,
    },
    UpdateExpression: "ADD collections :no",
    ExpressionAttributeValues: {
      ":no": 1,
    },
  });
  await dynamodb.update({
    Key: {
      PK: `collectionCount`,
      SK: `marketplace#${marketplace}`,
    },
    UpdateExpression: "ADD collections :no",
    ExpressionAttributeValues: {
      ":no": 1,
    },
  });
  await dynamodb.batchWrite([
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

export async function insertSales({
  slug,
  marketplace,
  sales,
}: {
  slug: string;
  marketplace: Marketplace;
  sales: any[];
}) {
  const batchWriteStep = 25;
  for (let i = 0; i < sales.length; i += batchWriteStep) {
    const items = sales.slice(i, i + batchWriteStep).map((sale: any) => {
      const { timestamp, txnHash, ...data } = sale;
      return {
        PK: `sales#${slug}#marketplace#${marketplace}`,
        SK: `${timestamp}#txnHash#${txnHash}`,
        ...data,
      };
    });
    await dynamodb.batchWrite(items);
  }
}

export async function updateCollectionStatistics({
  slug,
  chain,
  marketplace,
  volumes,
}: {
  slug: string;
  chain: Blockchain;
  marketplace: Marketplace;
  volumes: any;
}) {
  for (const timestamp in volumes) {
    const { volume, volumeUSD } = volumes[timestamp];
    await dynamodb.update({
      Key: {
        PK: `statistics#${slug}`,
        SK: timestamp,
      },
      UpdateExpression: `
        ADD chain_${chain}_volume :volume,
            chain_${chain}_volumeUSD :volumeUSD,
            marketplace_${marketplace}_volume :volume,
            marketplace_${marketplace}_volumeUSD :volumeUSD
      `,
      ExpressionAttributeValues: {
        ":volume": volume,
        ":volumeUSD": volumeUSD,
      },
    });

    await dynamodb.update({
      Key: {
        PK: `globalStatistics`,
        SK: timestamp,
      },
      UpdateExpression: `
        ADD chain_${chain}_volume :volume,
            chain_${chain}_volumeUSD :volumeUSD,
            marketplace_${marketplace}_volume :volume,
            marketplace_${marketplace}_volumeUSD :volumeUSD
      `,
      ExpressionAttributeValues: {
        ":volume": volume,
        ":volumeUSD": volumeUSD,
      },
    });
  }
}

export async function getGlobalStatistics() {
  return dynamodb
    .query({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "globalStatistics",
      },
      ScanIndexForward: false,
    })
    .then((result) => result.Items);
}

export async function getChart({
  chain,
  marketplace,
}: {
  chain?: any;
  marketplace?: any;
}) {
  const globalStatistics = await dynamodb
    .query({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "globalStatistics",
      },
      ScanIndexForward: false,
    })
    .then((result) => result.Items);

  if (chain) {
    return globalStatistics.map((statistic) => ({
      timestamp: statistic.SK,
      volume: statistic[`chain_${chain}_volume`],
      volumeUSD: statistic[`chain_${chain}_volumeUSD`],
    }));
  }

  if (marketplace) {
    return globalStatistics.map((statistic) => ({
      timestamp: statistic.SK,
      volume: statistic[`marketplace_${marketplace}_volume`],
      volumeUSD: statistic[`marketplace_${marketplace}_volumeUSD`],
    }));
  }

  return globalStatistics.map((statistic) => ({
    timestamp: statistic.SK,
    volume: Object.entries(statistic).reduce((volume, entry) => {
      if (entry[0].startsWith("chain") && entry[0].endsWith("volume")) {
        return volume + entry[1];
      }
      return volume;
    }, 0),
    volumeUSD: Object.entries(statistic).reduce((volumeUSD, entry) => {
      if (entry[0].startsWith("chain") && entry[0].endsWith("volumeUSD")) {
        return volumeUSD + entry[1];
      }
      return volumeUSD;
    }, 0),
  }));
}

export function getCollection(slug: string) {
  return dynamodb
    .query({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `collection#${slug}`,
      },
    })
    .then((result) => result.Items);
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
    return dynamodb
      .query({
        IndexName: "collectionsIndex",
        KeyConditionExpression: "category = :category",
        ExpressionAttributeValues: {
          ":category": category,
        },
        ScanIndexForward: false,
      })
      .then((result) => result.Items);
  }
}

export function getLastSaleTime({
  slug,
  marketplace,
}: {
  slug: string;
  marketplace: Marketplace;
}) {
  return dynamodb
    .query({
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `sales#${slug}#marketplace#${marketplace}`,
      },
      Limit: 1,
      ScanIndexForward: false,
    })
    .then((result) => {
      const results = result.Items;
      if (results.length) {
        return results[0]?.SK?.split("#")[0];
      }
      return "0";
    });
}
