import { Blockchain, Marketplace } from "../types";
import dynamodb from "../utils/dynamodb";

export class Collection {
  address: string;
  chain: Blockchain;
  slug: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  website: string;
  discordUrl: string;
  telegramUrl: string;
  twitterUsername: string;
  mediumUsername: string;

  static async upsert({
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

    // If collection already exists, update statistics only
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

    // If collection doesn't exist, increment collection counts
    // and insert metadata and statistics
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

  static async get(slug: string) {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `collection#${slug}`,
        },
      })
      .then((result) => result.Items);
  }

  // TODO Get all when getting sales
  static async getSorted({
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

  static async getCount() {
    return dynamodb
      .query({
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `collectionCount`,
        },
      })
      .then((result) => result.Items);
  }
}
